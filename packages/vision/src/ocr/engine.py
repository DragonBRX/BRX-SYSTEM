"""
BRX SYSTEM - OCR Module
Text extraction from images using Tesseract and PaddleOCR
"""

import time
from dataclasses import dataclass
from typing import List, Optional

from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class OCRBlock:
    text: str
    confidence: float
    bbox: List[int]  # [x1, y1, x2, y2]


@dataclass
class OCRResult:
    text: str
    blocks: List[OCRBlock]
    model: str
    inference_time_ms: float


class OCREngine:
    def __init__(self, engine: str = "tesseract"):
        self.engine = engine
        self.logger = get_logger(f"ocr.{engine}")

    def extract_text(self, image_path: str) -> OCRResult:
        start = time.time()

        if self.engine == "tesseract":
            return self._tesseract_ocr(image_path, start)
        elif self.engine == "paddle":
            return self._paddle_ocr(image_path, start)
        else:
            raise ValueError(f"Unknown OCR engine: {self.engine}")

    def _tesseract_ocr(self, image_path: str, start_time: float) -> OCRResult:
        try:
            import pytesseract
            from PIL import Image

            img = Image.open(image_path)
            data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)

            blocks = []
            full_text = []

            for i in range(len(data["text"])):
                text = data["text"][i].strip()
                conf = int(data["conf"][i])

                if text and conf > 30:
                    bbox = [
                        data["left"][i],
                        data["top"][i],
                        data["left"][i] + data["width"][i],
                        data["top"][i] + data["height"][i],
                    ]
                    blocks.append(OCRBlock(text=text, confidence=conf/100, bbox=bbox))
                    full_text.append(text)

            inference_time = (time.time() - start_time) * 1000

            return OCRResult(
                text=" ".join(full_text),
                blocks=blocks,
                model="tesseract",
                inference_time_ms=inference_time,
            )
        except ImportError:
            raise RuntimeError("pytesseract not installed")

    def _paddle_ocr(self, image_path: str, start_time: float) -> OCRResult:
        try:
            from paddleocr import PaddleOCR

            ocr = PaddleOCR(use_angle_cls=True, lang="en")
            result = ocr.ocr(image_path, cls=True)

            blocks = []
            full_text = []

            if result and result[0]:
                for line in result[0]:
                    bbox = [int(x) for pt in line[0] for x in pt]
                    text = line[1][0]
                    conf = line[1][1]
                    blocks.append(OCRBlock(text=text, confidence=conf, bbox=bbox))
                    full_text.append(text)

            inference_time = (time.time() - start_time) * 1000

            return OCRResult(
                text=" ".join(full_text),
                blocks=blocks,
                model="paddleocr",
                inference_time_ms=inference_time,
            )
        except ImportError:
            raise RuntimeError("paddleocr not installed")
