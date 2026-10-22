from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

def sniff_image_mime(data: bytes, default: str = "image/png") -> str:
    """Best-effort image MIME type from magic bytes (pages may mix JPEG/PNG/WebP)."""
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return default


class InferenceRequest(BaseModel):
    prompt: str
    system_instruction: Optional[str] = None
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    response_mime_type: Optional[str] = "text/plain"
    # --- Optional multimodal (vision) input -------------------------------
    # When ``image`` is provided the request becomes a multimodal/vision call
    # (e.g. handwriting OCR). It is OPTIONAL and defaults to ``None`` so every
    # existing text-only call is completely unaffected (backward-compatible):
    # providers take the vision path only when ``image`` is set, otherwise they
    # behave exactly as before. ``image_mime_type`` is an optional hint about
    # the encoding (e.g. ``"image/png"``) passed through to the backend.
    image: Optional[bytes] = None
    image_mime_type: Optional[str] = None
    # Optional ordered list of images (e.g. every page of a handwritten answer).
    # When set, providers send all of them in order; ``image`` stays populated
    # with the first one so single-image providers keep working unchanged.
    images: Optional[List[bytes]] = None
    # --- Optional multimodal (audio) input --------------------------------
    # When ``audio`` is provided the request becomes a multimodal/audio call
    # (e.g. speech-to-text). Like ``image`` it is OPTIONAL and defaults to
    # ``None`` so every existing text-only (and vision) call is completely
    # unaffected (backward-compatible): providers take the audio path only when
    # ``audio`` is set, otherwise they behave exactly as before.
    # ``audio_mime_type`` is an optional hint about the encoding (e.g.
    # ``"audio/wav"``, ``"audio/mp3"``) passed through to the backend.
    audio: Optional[bytes] = None
    audio_mime_type: Optional[str] = None

class InferenceResponse(BaseModel):
    text: str
    raw_response: Any = None
    usage_metadata: Dict[str, int] = {}
    provider: str

class IInferenceProvider(ABC):
    @abstractmethod
    def generate(self, request: InferenceRequest) -> InferenceResponse:
        pass

    @abstractmethod
    async def generate_async(self, request: InferenceRequest) -> InferenceResponse:
        pass
