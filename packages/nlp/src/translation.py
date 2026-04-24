"""
BRX SYSTEM - Translation Module
Multi-language translation using MarianMT and mBART
"""

import time
from dataclasses import dataclass
from typing import List, Optional

from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class TranslationResult:
    source_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    model: str
    inference_time_ms: float


class Translator:
    def __init__(self, model_name: str = "Helsinki-NLP/opus-mt-en-ROMANCE"):
        self.model_name = model_name
        self.pipeline = None
        self.logger = get_logger("translator")
        self._load_model()

    def _load_model(self):
        try:
            from transformers import pipeline
            import torch
            self.pipeline = pipeline(
                "translation",
                model=self.model_name,
                device=0 if torch.cuda.is_available() else -1,
            )
            self.logger.info("translator_model_loaded")
        except Exception as e:
            self.logger.error("translator_model_load_failed", error=str(e))

    async def translate(self, text: str, target_lang: str = "pt", source_lang: str = "en") -> TranslationResult:
        start = time.time()
        if not self.pipeline:
            raise RuntimeError("Model not loaded")

        result = self.pipeline(text, max_length=512)
        translated = result[0]["translation_text"]

        inference_time = (time.time() - start) * 1000
        return TranslationResult(
            source_text=text,
            translated_text=translated,
            source_lang=source_lang,
            target_lang=target_lang,
            model=self.model_name,
            inference_time_ms=inference_time,
        )

    async def batch_translate(self, texts: List[str], target_lang: str = "pt") -> List[TranslationResult]:
        return [await self.translate(t, target_lang) for t in texts]
