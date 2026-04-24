"""
BRX SYSTEM - Object Detection Module
YOLO, DETR, and custom detection models
"""

import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image
from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class DetectionBox:
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_id: int
    class_name: str


@dataclass
class DetectionResult:
    boxes: List[DetectionBox]
    image_size: Tuple[int, int]
    model: str
    inference_time_ms: float
    original_image: Optional[Any] = None


class ObjectDetector:
    def __init__(self, model_name: str = "yolov8n"):
        self.model_name = model_name
        self.model = None
        self.logger = get_logger("object_detector")
        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_name)
            self.logger.info("yolo_model_loaded", model=self.model_name)
        except Exception as e:
            self.logger.error("yolo_load_failed", error=str(e))

    def detect(self, image_path: str, confidence: float = 0.25) -> DetectionResult:
        start = time.time()
        if self.model is None:
            raise RuntimeError("Model not loaded")

        results = self.model(image_path, conf=confidence)

        boxes = []
        img_size = (0, 0)

        for result in results:
            img_size = (result.orig_shape[1], result.orig_shape[0])

            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                cls_name = result.names[cls_id]

                boxes.append(DetectionBox(
                    x1=x1, y1=y1, x2=x2, y2=y2,
                    confidence=conf, class_id=cls_id, class_name=cls_name,
                ))

        inference_time = (time.time() - start) * 1000
        return DetectionResult(
            boxes=boxes, image_size=img_size,
            model=self.model_name, inference_time_ms=inference_time,
        )

    def detect_batch(self, image_paths: List[str], confidence: float = 0.25) -> List[DetectionResult]:
        return [self.detect(p, confidence) for p in image_paths]

    def get_class_counts(self, result: DetectionResult) -> Dict[str, int]:
        counts = {}
        for box in result.boxes:
            counts[box.class_name] = counts.get(box.class_name, 0) + 1
        return counts


class FaceDetector:
    def __init__(self, model_name: str = "mtcnn"):
        self.model_name = model_name
        self.detector = None
        self.logger = get_logger("face_detector")
        self._load_model()

    def _load_model(self):
        try:
            from facenet_pytorch import MTCNN
            self.detector = MTCNN(keep_all=True)
            self.logger.info("face_detector_loaded")
        except Exception as e:
            self.logger.error("face_detector_load_failed", error=str(e))

    def detect_faces(self, image_path: str) -> List[Dict[str, Any]]:
        from PIL import Image
        img = Image.open(image_path)

        if self.detector is None:
            raise RuntimeError("Face detector not loaded")

        boxes, probs = self.detector.detect(img)
        faces = []

        if boxes is not None:
            for box, prob in zip(boxes, probs):
                faces.append({
                    "box": [float(x) for x in box],
                    "confidence": float(prob),
                })

        return faces
