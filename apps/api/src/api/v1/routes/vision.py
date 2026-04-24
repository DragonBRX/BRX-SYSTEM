"""
BRX SYSTEM - Vision API Routes
Image processing endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel

from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


class DetectRequest(BaseModel):
    image_path: str
    confidence: float = 0.25
    model: str = "yolov8n"


@router.post("/detect")
async def detect_objects(
    file: UploadFile = File(...),
    confidence: float = Form(0.25),
    model: str = Form("yolov8n"),
):
    """Detect objects in an image."""
    try:
        import tempfile
        from packages.vision.src.detection.object import ObjectDetector

        temp_path = tempfile.mktemp(suffix=".jpg")
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        detector = ObjectDetector(model)
        result = detector.detect(temp_path, confidence)

        return {
            "boxes": [
                {
                    "x1": b.x1,
                    "y1": b.y1,
                    "x2": b.x2,
                    "y2": b.y2,
                    "confidence": b.confidence,
                    "class": b.class_name,
                }
                for b in result.boxes
            ],
            "counts": detector.get_class_counts(result),
            "image_size": result.image_size,
            "model": result.model,
            "inference_time_ms": result.inference_time_ms,
        }
    except Exception as e:
        logger.error("object_detection_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    """Classify an image."""
    try:
        import tempfile
        from packages.vision.src.classification.image import ImageClassifier

        temp_path = tempfile.mktemp(suffix=".jpg")
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        classifier = ImageClassifier()
        result = classifier.classify(temp_path)

        return {
            "top_prediction": {
                "label": result.label,
                "confidence": result.confidence,
            },
            "top_k": result.top_k,
            "model": result.model,
            "inference_time_ms": result.inference_time_ms,
        }
    except Exception as e:
        logger.error("image_classification_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ocr")
async def extract_text_from_image(
    file: UploadFile = File(...),
    engine: str = Form("tesseract"),
):
    """Extract text from image using OCR."""
    try:
        import tempfile
        from packages.vision.src.ocr.engine import OCREngine

        temp_path = tempfile.mktemp(suffix=".jpg")
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        ocr = OCREngine(engine)
        result = ocr.extract_text(temp_path)

        return {
            "text": result.text,
            "blocks": [
                {
                    "text": b.text,
                    "confidence": b.confidence,
                    "bbox": b.bbox,
                }
                for b in result.blocks
            ],
            "model": result.model,
            "inference_time_ms": result.inference_time_ms,
        }
    except Exception as e:
        logger.error("ocr_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
