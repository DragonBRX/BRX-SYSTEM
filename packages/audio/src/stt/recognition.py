"""
BRX SYSTEM - Speech-to-Text Module
Whisper, Wav2Vec2, and system speech recognition
"""

import time
from dataclasses import dataclass
from typing import List, Optional

from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class STTResult:
    text: str
    language: str
    confidence: float
    segments: List[dict]
    model: str
    inference_time_ms: float


class WhisperRecognizer:
    def __init__(self, model_name: str = "base"):
        self.model_name = model_name
        self.model = None
        self.logger = get_logger("whisper")
        self._load_model()

    def _load_model(self):
        try:
            import whisper
            self.model = whisper.load_model(self.model_name)
            self.logger.info("whisper_loaded", model=self.model_name)
        except Exception as e:
            self.logger.error("whisper_load_failed", error=str(e))

    def transcribe(self, audio_path: str, language: str = None) -> STTResult:
        start = time.time()
        if self.model is None:
            raise RuntimeError("Whisper model not loaded")

        result = self.model.transcribe(audio_path, language=language, verbose=False)

        segments = []
        for seg in result.get("segments", []):
            segments.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
                "confidence": seg.get("avg_logprob", 0),
            })

        inference_time = (time.time() - start) * 1000

        return STTResult(
            text=result["text"].strip(),
            language=result.get("language", "unknown"),
            confidence=0.0,
            segments=segments,
            model=f"whisper-{self.model_name}",
            inference_time_ms=inference_time,
        )

    def transcribe_batch(self, audio_paths: List[str]) -> List[STTResult]:
        return [self.transcribe(p) for p in audio_paths]
