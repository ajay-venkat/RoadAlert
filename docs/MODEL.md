# RoadWatch AI — Model Documentation

## Model Architecture

**YOLOv8s** (Small variant) — chosen for the optimal balance between detection accuracy and inference speed on both GPU and CPU.

| Property | Value |
|----------|-------|
| Architecture | YOLOv8s |
| Parameters | ~11.2M |
| Input Size | 640×640 |
| Task | Object Detection |
| Framework | Ultralytics |

---

## Training Methodology

### Transfer Learning

- **Base weights:** `yolov8s.pt` (pretrained on COCO)
- **Frozen layers:** First 10 backbone layers frozen to retain general feature extraction
- **Fine-tuned layers:** Detection head fully retrained on road damage data

### Training Configuration

```yaml
epochs: 50
imgsz: 640
batch: 16
freeze: 10
patience: 10  # Early stopping
optimizer: auto (SGD)
lr0: 0.01
lrf: 0.01
```

---

## Datasets

### Option A: Kaggle Pothole Dataset (Prototype)

- ~3,000–4,000 annotated images
- Single class: `pothole`
- Pre-split in YOLO format
- Sources:
  - [Annotated Potholes Dataset](https://www.kaggle.com/datasets/chitholian/annotated-potholes-dataset)
  - [Pothole Detection Dataset](https://www.kaggle.com/datasets/atulyakumar98/pothole-detection-dataset)

### Option B: RDD2022 (Production)

- 47,000+ annotated images from 6 countries
- 4 classes: D00 (Longitudinal Crack), D10 (Transverse Crack), D20 (Alligator Crack), D40 (Pothole)
- Gold-standard benchmark dataset
- Source: [Figshare](https://figshare.com/articles/dataset/RDD2022/21431547)

---

## Severity Classification

Severity is not a model output — it's a post-processing heuristic based on the bounding box area relative to the frame:

```python
box_area = (x2 - x1) * (y2 - y1)
frame_area = frame_width * frame_height
ratio = box_area / frame_area

if ratio < 0.02:
    severity = "minor"
elif ratio < 0.05:
    severity = "moderate"
else:
    severity = "severe"
```

**Rationale:** Larger bounding boxes generally indicate more significant road damage. This heuristic can be refined with depth estimation or multi-frame analysis.

---

## Expected Performance

### On Kaggle Pothole Dataset (Single Class)

| Metric | Value |
|--------|-------|
| mAP50 | ~0.85–0.92 |
| mAP50-95 | ~0.55–0.65 |
| Precision | ~0.85 |
| Recall | ~0.80 |

### On RDD2022 (Multi-Class)

| Metric | Value |
|--------|-------|
| mAP50 | ~0.65–0.75 |
| mAP50-95 | ~0.40–0.50 |
| Precision | ~0.70 |
| Recall | ~0.65 |

*(Values are approximate; actual results depend on training duration, data splits, and augmentation.)*

---

## Inference Performance

| Device | Model | Speed (per image) |
|--------|-------|-------------------|
| NVIDIA RTX 3060 | YOLOv8s | ~8ms |
| NVIDIA T4 (Colab) | YOLOv8s | ~15ms |
| CPU (i7-12700H) | YOLOv8s | ~150ms |
| CPU (general) | YOLOv8n | ~80ms |

---

## Future Improvements

1. **Depth estimation** — Use stereo cameras or monocular depth models to estimate pothole depth for better severity classification
2. **Multi-frame tracking** — Track potholes across consecutive video frames to reduce false positives
3. **Edge deployment** — Export to TensorRT/ONNX for deployment on NVIDIA Jetson or mobile devices
4. **Accelerometer fusion** — Cross-validate visual detections with vehicle jolt data
5. **Active learning** — Use low-confidence detections to identify images for human annotation and model retraining
