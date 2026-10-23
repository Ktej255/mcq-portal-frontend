import os
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from .contracts import (
    IInferenceProvider,
    InferenceRequest,
    InferenceResponse,
    sniff_image_mime,
)
from app.core.config import settings


def _resolve_api_key() -> Optional[str]:
    """GOOGLE_API_KEY first, then GEMINI_API_KEY (settings, then raw env).

    The value is never logged or put in an error message.
    """
    return (
        settings.GOOGLE_API_KEY
        or os.environ.get("GOOGLE_API_KEY")
        or settings.GEMINI_API_KEY
        or os.environ.get("GEMINI_API_KEY")
        or None
    )


class GeminiProvider(IInferenceProvider):
    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.GEMINI_MODEL_ID
        self.timeout = settings.GEMINI_TIMEOUT_SECONDS
        genai.configure(api_key=_resolve_api_key())
        # The model is built per request when a system instruction is given
        # (the SDK takes it at model construction), so keep the plain one cached.
        self.model = genai.GenerativeModel(self.model_name)

    # -- request mapping ----------------------------------------------------
    @staticmethod
    def _generation_config(request: InferenceRequest) -> Dict[str, Any]:
        config: Dict[str, Any] = {"temperature": request.temperature}
        if request.response_mime_type and request.response_mime_type != "text/plain":
            config["response_mime_type"] = request.response_mime_type
        if request.max_tokens:
            config["max_output_tokens"] = request.max_tokens
        return config

    def _model_for(self, request: InferenceRequest):
        if request.system_instruction:
            return genai.GenerativeModel(
                self.model_name, system_instruction=request.system_instruction
            )
        return self.model

    def _call(self, request: InferenceRequest, contents) -> Any:
        return self._model_for(request).generate_content(
            contents,
            generation_config=self._generation_config(request),
            request_options={"timeout": self.timeout},
        )

    def generate(self, request: InferenceRequest) -> InferenceResponse:
        if request.audio is not None:
            # Multimodal (audio) path — e.g. speech-to-text. Only taken when a
            # caller supplies ``audio``.
            parts = [
                request.prompt,
                {
                    "mime_type": request.audio_mime_type or "audio/wav",
                    "data": request.audio,
                },
            ]
            response = self._call(request, parts)
            return InferenceResponse(
                text=response.text,
                raw_response=response,
                provider="google/gemini-audio",
            )

        images: List[bytes] = list(request.images or [])
        if not images and request.image is not None:
            images = [request.image]
        if images:
            # Multimodal (vision) path — e.g. handwriting OCR or grading all
            # pages of an answer. Images are sent in order after the prompt.
            parts: List[Any] = [request.prompt]
            for data in images:
                parts.append(
                    {
                        "mime_type": sniff_image_mime(
                            data, request.image_mime_type or "image/png"
                        ),
                        "data": data,
                    }
                )
            response = self._call(request, parts)
            return InferenceResponse(
                text=response.text,
                raw_response=response,
                provider="google/gemini-vision",
            )

        response = self._call(request, request.prompt)
        return InferenceResponse(
            text=response.text,
            raw_response=response,
            provider="google/gemini"
        )

    async def generate_async(self, request: InferenceRequest) -> InferenceResponse:
        # Gemini Python SDK doesn't have a direct async generate_content in standard sync client
        # but for this architectural shell, we wrap it or use the async client if available.
        # For now, we'll implement the sync-wrapper pattern to maintain the interface.
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate, request)
