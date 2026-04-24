"""
BRX SYSTEM - NLP API Routes
Text processing endpoints
"""

from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


class SentimentRequest(BaseModel):
    text: str
    model: str = "auto"


class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 150
    method: str = "extractive"


class NERRequest(BaseModel):
    text: str
    model: str = "dslim/bert-base-NER"


@router.post("/sentiment")
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of text."""
    try:
        from packages.nlp.src.classification import SentimentAnalyzer

        analyzer = SentimentAnalyzer()
        result = await analyzer.classify(request.text)

        return {
            "sentiment": result.label,
            "confidence": result.confidence,
            "scores": result.all_scores,
            "model": result.model,
        }
    except Exception as e:
        logger.error("sentiment_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_text(request: SummarizeRequest):
    """Summarize text."""
    try:
        from packages.nlp.src.summarization import ExtractiveSummarizer, AbstractiveSummarizer

        if request.method == "extractive":
            summarizer = ExtractiveSummarizer()
        else:
            summarizer = AbstractiveSummarizer()

        result = await summarizer.summarize(request.text, request.max_length)

        return {
            "summary": result.summary,
            "original_length": result.original_length,
            "summary_length": result.summary_length,
            "compression_ratio": result.compression_ratio,
            "method": result.method,
            "model": result.model,
        }
    except Exception as e:
        logger.error("summarize_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ner")
async def extract_entities(request: NERRequest):
    """Extract named entities from text."""
    try:
        from packages.nlp.src.ner import NERExtractor

        extractor = NERExtractor(request.model)
        result = await extractor.extract(request.text)

        return {
            "entities": [
                {
                    "text": e.text,
                    "label": e.label,
                    "start": e.start,
                    "end": e.end,
                    "confidence": e.score,
                }
                for e in result.entities
            ],
            "grouped": extractor.group_by_type(result),
            "model": result.model,
        }
    except Exception as e:
        logger.error("ner_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
