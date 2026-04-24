"""
BRX SYSTEM - Text-to-Speech Module
Multiple TTS engines: Coqui TTS, pyttsx3, edge-tts
"""

import time
import tempfile
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class TTSResult:
    audio_path: str
    text: str
    sample_rate: int
    duration_seconds: float
    model: str
    inference_time_ms: float


class BaseTTS(ABC):
    def __init__(self, name: str):
        self.name = name
        self.logger = get_logger(f"tts.{name}")

    @abstractmethod
    async def synthesize(self, text: str, output_path: str = None, voice: str = None) -> TTSResult:
        pass


class CoquiTTS(BaseTTS):
    def __init__(self, model_name: str = "tts_models/en/ljspeech/tacotron2-DDC"):
        super().__init__("coqui")
        self.model_name = model_name
        self.tts = None
        self._load_model()

    def _load_model(self):
        try:
            from TTS.api import TTS
            self.tts = TTS(self.model_name)
            self.logger.info("coqui_tts_loaded", model=self.model_name)
        except Exception as e:
            self.logger.error("coqui_tts_load_failed", error=str(e))

    async def synthesize(self, text: str, output_path: str = None, voice: str = None) -> TTSResult:
        start = time.time()
        if self.tts is None:
            raise RuntimeError("TTS model not loaded")

        if not output_path:
            output_path = tempfile.mktemp(suffix=".wav")

        self.tts.tts_to_file(text=text, file_path=output_path)

        inference_time = (time.time() - start) * 1000

        return TTSResult(
            audio_path=output_path,
            text=text,
            sample_rate=22050,
            duration_seconds=0.0,
            model=self.model_name,
            inference_time_ms=inference_time,
        )


class EdgeTTS(BaseTTS):
    def __init__(self):
        super().__init__("edge")

    async def synthesize(self, text: str, output_path: str = None, voice: str = "en-US-AriaNeural") -> TTSResult:
        start = time.time()

        if not output_path:
            output_path = tempfile.mktemp(suffix=".mp3")

        try:
            import edge_tts
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
        except ImportError:
            raise RuntimeError("edge-tts not installed")

        inference_time = (time.time() - start) * 1000

        return TTSResult(
            audio_path=output_path,
            text=text,
            sample_rate=24000,
            duration_seconds=0.0,
            model="edge_tts",
            inference_time_ms=inference_time,
        )


class SystemTTS(BaseTTS):
    def __init__(self):
        super().__init__("system")
        self.engine = None
        self._init_engine()

    def _init_engine(self):
        try:
            import pyttsx3
            self.engine = pyttsx3.init()
            self.logger.info("system_tts_initialized")
        except Exception as e:
            self.logger.error("system_tts_init_failed", error=str(e))

    async def synthesize(self, text: str, output_path: str = None, voice: str = None) -> TTSResult:
        start = time.time()
        if self.engine is None:
            raise RuntimeError("TTS engine not initialized")

        if not output_path:
            output_path = tempfile.mktemp(suffix=".wav")

        self.engine.save_to_file(text, output_path)
        self.engine.runAndWait()

        inference_time = (time.time() - start) * 1000

        return TTSResult(
            audio_path=output_path,
            text=text,
            sample_rate=22050,
            duration_seconds=0.0,
            model="pyttsx3",
            inference_time_ms=inference_time,
        )
