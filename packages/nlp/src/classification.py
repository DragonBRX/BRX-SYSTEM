"""
BRX SYSTEM - NLP Text Classification Module
Zero-shot, sentiment analysis, and ensemble classification
"""

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ClassificationResult:
    label: str
    confidence: float
    all_scores: Dict[str, float]
    model: str
    inference_time_ms: float


class TextClassifier(ABC):
    def __init__(self, name: str, model_name: str):
        self.name = name
        self.model_name = model_name
        self.logger = get_logger(f"classifier.{name}")

    @abstractmethod
    async def classify(self, text: str, labels: List[str] = None) -> ClassificationResult:
        pass

    @abstractmethod
    async def batch_classify(self, texts: List[str], labels: List[str] = None) -> List[ClassificationResult]:
        pass


class ZeroShotClassifier(TextClassifier):
    def __init__(self, model_name: str = "facebook/bart-large-mnli"):
        super().__init__("zero_shot", model_name)
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        try:
            from transformers import pipeline
            import torch
            self.pipeline = pipeline(
                "zero-shot-classification",
                model=self.model_name,
                device=0 if torch.cuda.is_available() else -1,
            )
            self.logger.info("zero_shot_model_loaded", model=self.model_name)
        except Exception as e:
            self.logger.error("model_load_failed", error=str(e))

    async def classify(self, text: str, labels: List[str] = None) -> ClassificationResult:
        start = time.time()
        if not self.pipeline:
            raise RuntimeError("Model not loaded")
        labels = labels or ["positive", "negative", "neutral"]
        result = self.pipeline(text, labels, multi_label=False)
        scores = {label: score for label, score in zip(result["labels"], result["scores"])}
        inference_time = (time.time() - start) * 1000
        return ClassificationResult(
            label=result["labels"][0],
            confidence=result["scores"][0],
            all_scores=scores,
            model=self.model_name,
            inference_time_ms=inference_time,
        )

    async def batch_classify(self, texts: List[str], labels: List[str] = None) -> List[ClassificationResult]:
        return [await self.classify(t, labels) for t in texts]


class SentimentAnalyzer(TextClassifier):
    def __init__(self, model_name: str = "cardiffnlp/twitter-roberta-base-sentiment-latest"):
        super().__init__("sentiment", model_name)
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        try:
            from transformers import pipeline
            import torch
            self.pipeline = pipeline(
                "sentiment-analysis",
                model=self.model_name,
                device=0 if torch.cuda.is_available() else -1,
            )
            self.logger.info("sentiment_model_loaded")
        except Exception as e:
            self.logger.error("sentiment_model_load_failed", error=str(e))

    async def classify(self, text: str, labels: List[str] = None) -> ClassificationResult:
        start = time.time()
        if not self.pipeline:
            raise RuntimeError("Model not loaded")
        result = self.pipeline(text[:512])[0]
        label_map = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
        mapped_label = label_map.get(result["label"], result["label"])
        return ClassificationResult(
            label=mapped_label,
            confidence=result["score"],
            all_scores={mapped_label: result["score"]},
            model=self.model_name,
            inference_time_ms=(time.time() - start) * 1000,
        )

    async def batch_classify(self, texts: List[str], labels: List[str] = None) -> List[ClassificationResult]:
        if not self.pipeline:
            raise RuntimeError("Model not loaded")
        start = time.time()
        results = self.pipeline([t[:512] for t in texts])
        label_map = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
        output = []
        for result in results:
            mapped_label = label_map.get(result["label"], result["label"])
            output.append(ClassificationResult(
                label=mapped_label,
                confidence=result["score"],
                all_scores={mapped_label: result["score"]},
                model=self.model_name,
                inference_time_ms=(time.time() - start) * 1000 / len(texts),
            ))
        return output
