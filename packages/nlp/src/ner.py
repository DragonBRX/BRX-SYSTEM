"""
BRX SYSTEM - Named Entity Recognition Module
Extract entities from text with multiple models
"""

import time
from dataclasses import dataclass
from typing import Dict, List, Optional

from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class Entity:
    text: str
    label: str
    start: int
    end: int
    score: float


@dataclass
class NERResult:
    entities: List[Entity]
    model: str
    inference_time_ms: float


class NERExtractor:
    def __init__(self, model_name: str = "dslim/bert-base-NER"):
        self.model_name = model_name
        self.pipeline = None
        self.logger = get_logger("ner")
        self._load_model()

    def _load_model(self):
        try:
            from transformers import pipeline
            import torch
            self.pipeline = pipeline(
                "ner",
                model=self.model_name,
                tokenizer=self.model_name,
                device=0 if torch.cuda.is_available() else -1,
                aggregation_strategy="simple",
            )
            self.logger.info("ner_model_loaded", model=self.model_name)
        except Exception as e:
            self.logger.error("ner_model_load_failed", error=str(e))

    async def extract(self, text: str) -> NERResult:
        start = time.time()
        if not self.pipeline:
            raise RuntimeError("Model not loaded")

        results = self.pipeline(text)
        entities = []

        for r in results:
            entities.append(Entity(
                text=r["word"],
                label=r["entity_group"],
                start=r["start"],
                end=r["end"],
                score=r["score"],
            ))

        inference_time = (time.time() - start) * 1000
        return NERResult(entities=entities, model=self.model_name, inference_time_ms=inference_time)

    def group_by_type(self, result: NERResult) -> Dict[str, List[str]]:
        grouped = {}
        for entity in result.entities:
            if entity.label not in grouped:
                grouped[entity.label] = []
            grouped[entity.label].append(entity.text)
        return grouped
