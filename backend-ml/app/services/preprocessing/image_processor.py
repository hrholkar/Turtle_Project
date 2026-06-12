"""
Image preprocessing pipeline for sea turtle re-identification.

Steps:
1. Load image (handle EXIF rotation)
2. Convert to RGB
3. Resize to model input (256x256 → center crop 224x224)
4. Normalize with ImageNet statistics
5. Return as tensor ready for MobileNetV2
"""

import io
import cv2
import numpy as np
from PIL import Image, ImageOps
import torch
from torchvision import transforms
from typing import Union


# ── ImageNet normalization stats ──────────────────────────────────────────────
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# ── Transform pipeline ────────────────────────────────────────────────────────
preprocess_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


class ImageProcessor:
    """
    Preprocesses turtle images for feature extraction.

    Handles:
    - EXIF auto-rotation (important for mobile-captured images)
    - Grayscale to RGB conversion
    - RGBA → RGB with white background
    - Aspect-ratio-preserving resize
    - ImageNet normalization
    """

    @staticmethod
    def load_from_bytes(image_bytes: bytes) -> Image.Image:
        """Load image from raw bytes, applying EXIF rotation correction."""
        image = Image.open(io.BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image)  # Fix mobile rotation
        return ImageProcessor._normalize_mode(image)

    @staticmethod
    def load_from_path(path: str) -> Image.Image:
        """Load image from file path."""
        image = Image.open(path)
        image = ImageOps.exif_transpose(image)
        return ImageProcessor._normalize_mode(image)

    @staticmethod
    def _normalize_mode(image: Image.Image) -> Image.Image:
        """Ensure image is RGB regardless of source mode."""
        if image.mode == 'RGBA':
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            return background
        elif image.mode != 'RGB':
            return image.convert('RGB')
        return image

    @staticmethod
    def to_tensor(image: Image.Image) -> torch.Tensor:
        """Apply preprocessing pipeline and return a (1, 3, 224, 224) tensor."""
        tensor = preprocess_transform(image)
        return tensor.unsqueeze(0)  # Add batch dimension

    @staticmethod
    def preprocess_bytes(image_bytes: bytes) -> torch.Tensor:
        """Full pipeline from bytes to tensor."""
        image = ImageProcessor.load_from_bytes(image_bytes)
        return ImageProcessor.to_tensor(image)

    @staticmethod
    def preprocess_path(path: str) -> torch.Tensor:
        """Full pipeline from file path to tensor."""
        image = ImageProcessor.load_from_path(path)
        return ImageProcessor.to_tensor(image)

    @staticmethod
    def enhance_for_neck_region(image: Image.Image) -> Image.Image:
        """
        Optional enhancement to improve neck-pattern discrimination.
        Applies mild CLAHE (contrast-limited adaptive histogram equalization)
        to improve low-contrast pattern visibility.
        """
        img_np = np.array(image)
        img_lab = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)
        l_channel, a_channel, b_channel = cv2.split(img_lab)

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l_channel)

        enhanced_lab = cv2.merge([l_enhanced, a_channel, b_channel])
        enhanced_rgb = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)
        return Image.fromarray(enhanced_rgb)
