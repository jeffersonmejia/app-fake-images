from __future__ import annotations

from hashlib import sha256
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
import json
import math
from pathlib import Path
import time

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError
import tensorflow as tf

from detector_frecuencias import RADIAL_BINS, extract_image


SERVICE_DIR = Path(__file__).resolve().parent
MODEL_PATH = SERVICE_DIR / "modelo.keras"
METRICS_PATH = SERVICE_DIR / "metricas.json"
MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
Image.MAX_IMAGE_PIXELS = 25_000_000


def frequency_maps(features: np.ndarray) -> np.ndarray:
    start = len(RADIAL_BINS)
    stop = start + 2 * 63
    mean, std = np.split(features, 2, axis=1)
    channels = np.stack([mean[:, start:stop], std[:, start:stop]], axis=-1)
    channels = channels.reshape(-1, 2, 63, 2)
    channels = np.pad(channels, ((0, 0), (0, 0), (1, 0), (0, 0)))
    return channels.reshape(-1, 2, 8, 8, 2).transpose(0, 2, 3, 1, 4).reshape(-1, 8, 8, 4)


def load_runtime() -> tuple[tf.keras.Model, float, str]:
    metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    threshold = metrics.get("threshold")
    if not isinstance(threshold, (float, int)) or not 0 < threshold < 1:
        raise ValueError("El umbral del modelo no está disponible o es inválido.")
    model_version = sha256(MODEL_PATH.read_bytes()).hexdigest()
    model = tf.keras.models.load_model(MODEL_PATH, compile=False, safe_mode=True)
    return model, float(threshold), model_version


MODEL, THRESHOLD, MODEL_VERSION = load_runtime()


class VerificationHandler(BaseHTTPRequestHandler):
    server_version = "ImageVerifier/1.0"

    def do_GET(self) -> None:
        if self.path != "/health":
            self.send_error(404)
            return
        self._send_json(200, {"ready": True, "model_version": MODEL_VERSION})

    def do_POST(self) -> None:
        if self.path != "/verify":
            self.send_error(404)
            return

        mime_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if mime_type not in ALLOWED_MIME_TYPES:
            self._send_json(415, {"error": "UNSUPPORTED_IMAGE_FORMAT"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(400, {"error": "INVALID_CONTENT_LENGTH"})
            return
        if content_length <= 0 or content_length > MAX_IMAGE_BYTES:
            self._send_json(413, {"error": "IMAGE_SIZE_OUT_OF_RANGE"})
            return

        image_bytes = self.rfile.read(content_length)
        image_sha256 = sha256(image_bytes).hexdigest()
        claimed_hash = self.headers.get("X-Image-SHA256", "").lower()
        if len(image_bytes) != content_length or claimed_hash != image_sha256:
            self._send_json(422, {"error": "IMAGE_HASH_MISMATCH"})
            return

        try:
            started_at = time.perf_counter()
            with Image.open(BytesIO(image_bytes)) as source:
                expected_mime_type = {
                    "JPEG": "image/jpeg",
                    "PNG": "image/png",
                    "WEBP": "image/webp",
                }.get(source.format or "")
                if expected_mime_type != mime_type:
                    self._send_json(415, {"error": "IMAGE_FORMAT_MISMATCH"})
                    return
                source.verify()
            with Image.open(BytesIO(image_bytes)) as source:
                prepared = ImageOps.exif_transpose(source).convert("RGB")
                features = extract_image(prepared)[None, :]
            maps = frequency_maps(features)
            score = float(MODEL(maps, training=False).numpy()[0, 0])
            if not math.isfinite(score) or not 0 <= score <= 1:
                self._send_json(503, {"error": "INVALID_MODEL_OUTPUT"})
                return
            classification = "PROBABLE_AI" if score >= THRESHOLD else "PROBABLE_REAL"
            self._send_json(200, {
                "image_sha256": image_sha256,
                "classification": classification,
                "score": score,
                "model_version": MODEL_VERSION,
                "latency_ms": round((time.perf_counter() - started_at) * 1000),
            })
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError, ValueError):
            self._send_json(400, {"error": "INVALID_IMAGE"})
        except Exception:
            self._send_json(503, {"error": "MODEL_INFERENCE_UNAVAILABLE"})

    def _send_json(self, status: int, payload: dict[str, object]) -> None:
        encoded = json.dumps(payload, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, _format: str, *_args: object) -> None:
        return


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 8090), VerificationHandler)
    print("Verificador de imágenes disponible en http://127.0.0.1:8090", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
