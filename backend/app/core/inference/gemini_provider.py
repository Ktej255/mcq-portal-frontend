from typing import Optional

from google.genai import types

from .contracts import (
    IInferenceProvider,
    InferenceRequest,
    InferenceResponse,
    sniff_image_mime,
)
from .gemini_client import build_gemini_client, gemini_model


class GeminiProvider(IInferenceProvider):
    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or gemini_model()
        self.client = build_gemini_client()

    def _config(self, request: InferenceRequest) -> types.GenerateContentConfig:
        options = {"temperature": request.temperature}
        if request.system_instruction:
            options["system_instruction"] = request.system_instruction
        if request.response_mime_type and request.response_mime_type != "text/plain":
            options["response_mime_type"] = request.response_mime_type
        if request.max_tokens:
            options["max_output_tokens"] = request.max_tokens
        return types.GenerateContentConfig(**options)

    def generate(self, request: InferenceRequest) -> InferenceResponse:
        contents: list = [request.prompt]
        provider = "google/gemini"
        if request.audio is not None:
            # Audio alongside the prompt, for example speech to text.
            contents.append(
                types.Part.from_bytes(
                    data=request.audio, mime_type=request.audio_mime_type or "audio/wav"
                )
            )
            provider = "google/gemini-audio"
        else:
            images = list(request.images or [])
            if not images and request.image is not None:
                images = [request.image]
            # Images in order after the prompt: reading handwriting, or
            # grading every page of an answer in one call.
            for data in images:
                contents.append(
                    types.Part.from_bytes(
                        data=data,
                        mime_type=sniff_image_mime(data, request.image_mime_type or "image/png"),
                    )
                )
            if images:
                provider = "google/gemini-vision"

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=self._config(request),
        )
        text = response.text
        if not isinstance(text, str) or not text.strip():
            # A blocked or empty reply must not travel on as if it were an answer.
            raise ValueError("Gemini returned an empty response")
        return InferenceResponse(text=text, raw_response=response, provider=provider)

    async def generate_async(self, request: InferenceRequest) -> InferenceResponse:
        import asyncio

        return await asyncio.get_running_loop().run_in_executor(None, self.generate, request)
