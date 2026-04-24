"""
BRX SYSTEM - Text Summarization Module
Extractive and abstractive summarization
"""

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class SummaryResult:
    summary: str
    original_length: int
    summary_length: int
    compression_ratio: float
    model: str
    method: str
    inference_time_ms: float


class Summarizer(ABC):
    def __init__(self, name: str, method: str):
        self.name = name
        self.method = method
        self.logger = get_logger(f"summarizer.{name}")

    @abstractmethod
    async def summarize(self, text: str, max_length: int = 150) -> SummaryResult:
        pass


class ExtractiveSummarizer(Summarizer):
    def __init__(self):
        super().__init__("extractive", "frequency")

    async def summarize(self, text: str, max_length: int = 150) -> SummaryResult:
        start = time.time()
        sentences = text.replace("!", ".").replace("?", ".").split(".")
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

        if len(sentences) <= 3:
            summary = text[:max_length]
        else:
            from collections import Counter
            word_freq = Counter(text.lower().split())

            scored = []
            for sent in sentences:
                score = sum(word_freq[w] for w in sent.lower().split()) / (len(sent.split()) + 1)
                scored.append((score, sent))

            scored.sort(reverse=True)
            num_sentences = max(2, min(len(sentences) // 5, 5))
            top_sentences = scored[:num_sentences]
            top_sentences.sort(key=lambda x: sentences.index(x[1]))
            summary = " ".join([s[1] for s in top_sentences])[:max_length]

        inference_time = (time.time() - start) * 1000
        return SummaryResult(
            summary=summary,
            original_length=len(text),
            summary_length=len(summary),
            compression_ratio=len(summary) / len(text) if text else 0,
            model="frequency",
            method="extractive",
            inference_time_ms=inference_time,
        )


class AbstractiveSummarizer(Summarizer):
    def __init__(self, model_name: str = "facebook/bart-large-cnn"):
        super().__init__("abstractive", "transformer")
        self.model_name = model_name
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        try:
            from transformers import pipeline
            import torch
            self.pipeline = pipeline(
                "summarization",
                model=self.model_name,
                device=0 if torch.cuda.is_available() else -1,
            )
            self.logger.info("abstractive_model_loaded")
        except Exception as e:
            self.logger.error("model_load_failed", error=str(e))

    async def summarize(self, text: str, max_length: int = 150) -> SummaryResult:
        start = time.time()
        if not self.pipeline:
            raise RuntimeError("Model not loaded")

        result = self.pipeline(text[:1024], max_length=max_length, min_length=10, do_sample=False)
        summary = result[0]["summary_text"]

        inference_time = (time.time() - start) * 1000
        return SummaryResult(
            summary=summary,
            original_length=len(text),
            summary_length=len(summary),
            compression_ratio=len(summary) / len(text) if text else 0,
            model=self.model_name,
            method="abstractive",
            inference_time_ms=inference_time,
        )
