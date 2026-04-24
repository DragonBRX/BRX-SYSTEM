"""
BRX SYSTEM - Image Classification Module
ResNet, EfficientNet, ViT classifiers
"""

import time
from dataclasses import dataclass
from typing import List, Optional

import torch
import torchvision.transforms as transforms
from PIL import Image
from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ImageClassificationResult:
    label: str
    confidence: float
    top_k: List[dict]
    model: str
    inference_time_ms: float


class ImageClassifier:
    def __init__(self, model_name: str = "resnet50", num_classes: int = 1000):
        self.model_name = model_name
        self.num_classes = num_classes
        self.model = None
        self.transforms = None
        self.classes = None
        self.logger = get_logger("image_classifier")
        self._load_model()

    def _load_model(self):
        try:
            import torchvision.models as models

            if self.model_name == "resnet50":
                self.model = models.resnet50(pretrained=True)
            elif self.model_name == "resnet18":
                self.model = models.resnet18(pretrained=True)
            elif self.model_name == "efficientnet_b0":
                self.model = models.efficientnet_b0(pretrained=True)
            else:
                self.model = models.resnet50(pretrained=True)

            self.model.eval()
            if torch.cuda.is_available():
                self.model = self.model.cuda()

            self.transforms = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])

            # Load ImageNet classes
            import json
            import urllib.request
            url = "https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt"
            try:
                with urllib.request.urlopen(url) as response:
                    self.classes = [line.strip() for line in response.read().decode().splitlines()]
            except:
                self.classes = [f"class_{i}" for i in range(1000)]

            self.logger.info("image_classifier_loaded", model=self.model_name)
        except Exception as e:
            self.logger.error("classifier_load_failed", error=str(e))

    def classify(self, image_path: str, top_k: int = 5) -> ImageClassificationResult:
        start = time.time()
        if self.model is None:
            raise RuntimeError("Model not loaded")

        img = Image.open(image_path).convert("RGB")
        input_tensor = self.transforms(img).unsqueeze(0)

        if torch.cuda.is_available():
            input_tensor = input_tensor.cuda()

        with torch.no_grad():
            output = self.model(input_tensor)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)

        top_probs, top_indices = torch.topk(probabilities, top_k)

        top_k_list = []
        for prob, idx in zip(top_probs, top_indices):
            label = self.classes[idx] if self.classes else f"class_{idx}"
            top_k_list.append({"label": label, "confidence": float(prob)})

        inference_time = (time.time() - start) * 1000

        return ImageClassificationResult(
            label=top_k_list[0]["label"],
            confidence=top_k_list[0]["confidence"],
            top_k=top_k_list,
            model=self.model_name,
            inference_time_ms=inference_time,
        )
