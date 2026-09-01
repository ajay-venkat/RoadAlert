"""
RoadWatch AI — YOLOv8 Training Script
Fine-tunes YOLOv8 on pothole / road damage dataset.

This script is NOT exposed via the API — run it locally or on Google Colab / Kaggle.

Usage:
    python scripts/train.py

For Google Colab, use the following setup:
    !pip install ultralytics
    !python train.py
"""

import os
import sys
from pathlib import Path

# ─── Configuration ──────────────────────────────────────────────────────────

# Model variant: yolov8n (fastest) | yolov8s (balanced) | yolov8m (accurate)
MODEL_VARIANT = "yolov8s.pt"

# Training parameters
EPOCHS = 50
IMG_SIZE = 640
BATCH_SIZE = 16
FREEZE_LAYERS = 10  # Freeze backbone for transfer learning
PATIENCE = 10       # Early stopping patience

# Dataset config — update this path to your dataset location
DATASET_YAML = "dataset.yaml"

# Output directory for weights
WEIGHTS_DIR = Path(__file__).parent.parent / "models" / "weights"


# ─── Dataset YAML Template ─────────────────────────────────────────────────

DATASET_YAML_TEMPLATE = """
# RoadWatch AI — Dataset Configuration
# Update the 'path' field to point to your dataset root directory.

# ===========================================================
# Option A: Kaggle Pothole Dataset (fast prototype)
# Download from: https://www.kaggle.com/datasets/chitholian/annotated-potholes-dataset
# or: https://www.kaggle.com/datasets/atulyakumar98/pothole-detection-dataset
# ===========================================================

# Option B: RDD2022 (Road Damage Dataset 2022) — production grade
# Download from: https://figshare.com/articles/dataset/RDD2022/21431547
# Convert XML annotations to YOLO format using:
#   https://github.com/sivakanth1/Detecting_Road_Damage

path: /path/to/your/dataset   # UPDATE THIS
train: train/images
val: val/images
test: test/images

# For Kaggle pothole-only dataset:
nc: 1
names: ['pothole']

# For RDD2022 (uncomment and replace above):
# nc: 4
# names: ['D00', 'D10', 'D20', 'D40']
#   D00 = Longitudinal Crack
#   D10 = Transverse Crack
#   D20 = Alligator Crack
#   D40 = Pothole
""".strip()


def create_dataset_yaml():
    """Create a template dataset.yaml if it doesn't exist."""
    yaml_path = Path(DATASET_YAML)
    if not yaml_path.exists():
        yaml_path.write_text(DATASET_YAML_TEMPLATE)
        print(f"📝 Created {DATASET_YAML} — update the 'path' field before training!")
        return False
    return True


def train():
    """Fine-tune YOLOv8 on the pothole dataset."""
    from ultralytics import YOLO

    print("=" * 60)
    print("🚦 RoadWatch AI — Model Training")
    print("=" * 60)

    # Check dataset config
    if not create_dataset_yaml():
        print("\n⚠️  Please update dataset.yaml with your dataset path, then re-run.")
        sys.exit(1)

    # Ensure output directory exists
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    # Load pre-trained model
    print(f"\n📦 Loading pre-trained model: {MODEL_VARIANT}")
    model = YOLO(MODEL_VARIANT)

    # Start training
    print(f"\n🏋️ Starting training:")
    print(f"   Epochs:    {EPOCHS}")
    print(f"   Image size: {IMG_SIZE}")
    print(f"   Batch size: {BATCH_SIZE}")
    print(f"   Freeze:    {FREEZE_LAYERS} layers")
    print(f"   Patience:  {PATIENCE}")
    print(f"   Dataset:   {DATASET_YAML}")
    print()

    results = model.train(
        data=DATASET_YAML,
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        freeze=FREEZE_LAYERS,
        patience=PATIENCE,
        project=str(WEIGHTS_DIR.parent.parent / "runs"),
        name="pothole_detection",
        exist_ok=True,
        verbose=True,
    )

    # Copy best weights to the expected location
    best_weights = Path(results.save_dir) / "weights" / "best.pt"
    if best_weights.exists():
        target = WEIGHTS_DIR / "best.pt"
        import shutil
        shutil.copy2(best_weights, target)
        print(f"\n✅ Best weights saved to: {target}")
    else:
        print("\n⚠️  Training completed but best.pt not found. Check runs/ directory.")

    # Validate
    print("\n📊 Running validation...")
    metrics = model.val()
    print(f"\n📈 Validation Results:")
    print(f"   mAP50:     {metrics.box.map50:.4f}")
    print(f"   mAP50-95:  {metrics.box.map:.4f}")
    print(f"   Precision:  {metrics.box.mp:.4f}")
    print(f"   Recall:     {metrics.box.mr:.4f}")

    print("\n✅ Training complete!")
    print(f"   Weights: {WEIGHTS_DIR / 'best.pt'}")
    print(f"   Runs:    {results.save_dir}")


if __name__ == "__main__":
    train()
