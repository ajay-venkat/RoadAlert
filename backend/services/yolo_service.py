"""
RoadWatch AI — YOLO Inference Service
Handles model loading, inference, severity classification, and annotated image generation.
"""

import os
import logging
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np
from PIL import Image

from config import settings
from models.detection import BoundingBox, Severity

logger = logging.getLogger("roadwatch.yolo")

# Severity color mapping for annotations (BGR for OpenCV)
SEVERITY_COLORS = {
    Severity.MINOR: (0, 200, 0),       # Green
    Severity.MODERATE: (0, 165, 255),   # Orange
    Severity.SEVERE: (0, 0, 255),       # Red
}


class YOLOService:
    """Manages YOLOv8 model loading and inference."""

    def __init__(self):
        self.model = None
        self.device = "cpu"
        self._load_model()

    def _load_model(self):
        """Load the YOLOv8 model, auto-detecting GPU availability."""
        try:
            import torch
            if torch.cuda.is_available():
                self.device = "cuda"
                logger.info(f"🚀 GPU detected: {torch.cuda.get_device_name(0)}")
            else:
                self.device = "cpu"
                logger.info("💻 No GPU detected, using CPU for inference")
        except ImportError:
            self.device = "cpu"
            logger.info("💻 PyTorch not compiled with CUDA, using CPU")

        from ultralytics import YOLO

        model_path = settings.MODEL_PATH
        if os.path.exists(model_path):
            logger.info(f"✅ Loading fine-tuned model from {model_path}")
            self.model = YOLO(model_path)
        else:
            logger.warning(
                f"⚠️  Fine-tuned model not found at {model_path}. "
                f"Falling back to {settings.FALLBACK_MODEL}"
            )
            self.model = YOLO(settings.FALLBACK_MODEL)

        # Move model to the detected device
        self.model.to(self.device)
        logger.info(f"✅ Model loaded on {self.device}")

    def classify_severity(self, box_area: float, frame_area: float) -> Severity:
        """Classify detection severity based on bounding box area ratio."""
        if frame_area == 0:
            return Severity.MINOR

        ratio = box_area / frame_area

        if ratio < settings.SEVERITY_MINOR_MAX:
            return Severity.MINOR
        elif ratio < settings.SEVERITY_MODERATE_MAX:
            return Severity.MODERATE
        else:
            return Severity.SEVERE

    def run_inference(self, image: Image.Image) -> Tuple[List[BoundingBox], float]:
        """
        Run YOLO inference on a PIL Image.

        Returns:
            Tuple of (list of BoundingBox detections, max_confidence)
        """
        if self.model is None:
            raise RuntimeError("Model not loaded")

        # Convert PIL to numpy for inference
        img_array = np.array(image)
        frame_h, frame_w = img_array.shape[:2]
        frame_area = frame_h * frame_w

        # Run inference
        results = self.model(
            img_array,
            conf=settings.CONFIDENCE_THRESHOLD,
            iou=settings.IOU_THRESHOLD,
            verbose=False,
        )

        detections = []
        max_confidence = 0.0

        for result in results:
            if result.boxes is None:
                continue

            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())

                # Calculate box area for severity
                box_area = (x2 - x1) * (y2 - y1)
                severity = self.classify_severity(box_area, frame_area)

                # Map class name
                class_name = settings.CLASS_NAMES.get(class_id, f"class_{class_id}")

                detections.append(BoundingBox(
                    x1=round(x1, 2),
                    y1=round(y1, 2),
                    x2=round(x2, 2),
                    y2=round(y2, 2),
                    confidence=round(confidence, 4),
                    class_id=class_id,
                    class_name=class_name,
                    severity=severity,
                ))

                if confidence > max_confidence:
                    max_confidence = confidence

        return detections, round(max_confidence, 4)

    def annotate_image(
        self, image: Image.Image, detections: List[BoundingBox]
    ) -> Image.Image:
        """Draw bounding boxes and labels on the image."""
        img_array = np.array(image).copy()

        # Convert RGB → BGR for OpenCV drawing
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        else:
            img_bgr = img_array

        for det in detections:
            color = SEVERITY_COLORS.get(det.severity, (255, 255, 255))
            x1, y1, x2, y2 = int(det.x1), int(det.y1), int(det.x2), int(det.y2)

            # Draw bounding box
            cv2.rectangle(img_bgr, (x1, y1), (x2, y2), color, 2)

            # Label background
            label = f"{det.class_name} {det.confidence:.0%} [{det.severity.value}]"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(img_bgr, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
            cv2.putText(
                img_bgr, label, (x1 + 2, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1,
            )

        # Convert back BGR → RGB
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        return Image.fromarray(img_rgb)

    def get_overall_severity(self, detections: List[BoundingBox]) -> Severity:
        """Return the highest severity among all detections."""
        if not detections:
            return Severity.MINOR

        severity_order = {Severity.MINOR: 0, Severity.MODERATE: 1, Severity.SEVERE: 2}
        max_sev = max(detections, key=lambda d: severity_order[d.severity])
        return max_sev.severity


# Singleton instance
yolo_service = YOLOService()
