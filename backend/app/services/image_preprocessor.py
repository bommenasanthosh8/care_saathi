import io
import os
import math
from typing import List, Tuple, Optional
from PIL import Image, ImageOps, ImageEnhance
try:
    import pillow_heif
    # Register HEIC opener once
    pillow_heif.register_heif_opener()
except ImportError:
    pillow_heif = None

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".pdf"}
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
    "application/pdf", "application/octet-stream"
}

def validate_prescription_file(filename: str, content_type: Optional[str], file_size: int, file_bytes: Optional[bytes] = None) -> Tuple[bool, Optional[str]]:
    """
    Validates file format, size (< 10MB), and image integrity.
    Handles unsupported, corrupted, or empty files gracefully.
    """
    if file_size <= 0:
        return False, "Uploaded file is empty (0 bytes). Please upload a valid prescription document."

    if file_size > MAX_FILE_SIZE_BYTES:
        return False, f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum limit of 10 MB."
    
    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type '{ext}'. Please upload JPG, PNG, WEBP, HEIC, or PDF."
    
    if file_bytes is not None and len(file_bytes) > 0 and ext != ".pdf":
        try:
            with Image.open(io.BytesIO(file_bytes)) as test_img:
                test_img.verify()
        except Exception:
            return False, "Corrupted or unreadable image file. Please upload a clear, valid JPG, PNG, or WEBP prescription."

    return True, None

def preprocess_single_image(img: Image.Image) -> Image.Image:
    """
    Preprocesses a PIL Image:
    1. EXIF auto-rotation
    2. Resize so longest side is ~2000px
    3. Grayscale conversion
    4. Contrast enhancement
    """
    # 1. EXIF Auto-rotate
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # 2. Resize longest side ~2000px
    w, h = img.size
    max_dim = max(w, h)
    if max_dim > 2000:
        ratio = 2000.0 / float(max_dim)
        new_w = max(1, int(w * ratio))
        new_h = max(1, int(h * ratio))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    elif max_dim < 600:
        # If image is very small or low-res, upscale slightly for better OCR readability
        scale = min(2.0, 1200.0 / float(max_dim))
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # 3. Convert to Grayscale
    img = img.convert("L")

    # 4. Enhance Contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.45)

    return img

def image_to_jpeg_bytes(img: Image.Image) -> bytes:
    """Converts a PIL Image to optimized JPEG bytes in memory."""
    buf = io.BytesIO()
    # Save as RGB JPEG
    rgb_img = img.convert("RGB")
    rgb_img.save(buf, format="JPEG", quality=88, optimize=True)
    return buf.getvalue()

def process_uploaded_document(file_bytes: bytes, filename: str) -> List[Tuple[Image.Image, bytes]]:
    """
    Takes raw uploaded file bytes and returns a list of (processed_pil_image, jpeg_bytes)
    for each page (up to 3 pages for PDF, 1 for images).
    """
    ext = os.path.splitext(filename.lower())[1]
    results: List[Tuple[Image.Image, bytes]] = []

    if ext == ".pdf":
        if not fitz:
            raise RuntimeError("PDF processing library (PyMuPDF) is not installed.")
        
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages_to_process = min(3, doc.page_count)
        
        for p_idx in range(pages_to_process):
            page = doc.load_page(p_idx)
            # Render page at 2.0x resolution for crisp character edges
            pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
            img_mode = "RGB" if pix.alpha == 0 else "RGBA"
            pil_img = Image.frombytes(img_mode, [pix.width, pix.height], pix.samples)
            
            processed = preprocess_single_image(pil_img)
            jpeg_b = image_to_jpeg_bytes(processed)
            results.append((processed, jpeg_b))
        
        doc.close()
    else:
        # Standard or HEIC image
        pil_img = Image.open(io.BytesIO(file_bytes))
        processed = preprocess_single_image(pil_img)
        jpeg_b = image_to_jpeg_bytes(processed)
        results.append((processed, jpeg_b))

    return results
