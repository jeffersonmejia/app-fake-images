from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from PIL import Image, ImageOps
from scipy.fft import dctn, rfft2
from scipy.ndimage import gaussian_filter
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score, confusion_matrix, f1_score, roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

SEED = 42
CROP_SIZE = 128
WINDOW = np.outer(np.hanning(CROP_SIZE), np.hanning(CROP_SIZE))
FREQUENCY = np.hypot(
    np.fft.fftfreq(CROP_SIZE)[:, None], np.fft.rfftfreq(CROP_SIZE)[None, :]
)
RADIAL_EDGES = np.linspace(.01, .71, 19)
RADIAL_BINS = [
    (FREQUENCY >= low) & (FREQUENCY < high)
    for low, high in zip(RADIAL_EDGES, RADIAL_EDGES[1:])
]


def inventory(folder):
    records = []
    for label, name in enumerate(("nature", "ai")):
        for path in sorted((folder / name).iterdir()):
            if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".bmp"}:
                records.append((str(path), label, sha256(path.read_bytes()).hexdigest()))
    return pd.DataFrame(records, columns=["path", "label", "sha256"]).drop_duplicates(
        "sha256", keep=False
    )


def patch_features(rgb):
    gray = rgb @ np.array([.299, .587, .114], dtype=np.float32)
    residual = gray - gaussian_filter(gray, 1)
    power = np.abs(rfft2((gray - gray.mean()) * WINDOW)) ** 2
    power /= max(power.sum(), 1e-10)
    output = [np.log1p(power[mask].sum() * 1e5) for mask in RADIAL_BINS]
    blocks = gray.reshape(16, 8, 16, 8).transpose(0, 2, 1, 3)
    coefficients = np.abs(dctn(blocks, axes=(-2, -1), norm="ortho"))
    output.extend(np.log1p(100 * coefficients.mean(axis=(0, 1))).ravel()[1:])
    output.extend((coefficients < .001).mean(axis=(0, 1)).ravel()[1:])

    for signal in (gray, residual, rgb[:, :, 0] - rgb[:, :, 1], rgb[:, :, 2] - rgb[:, :, 1]):
        for axis in (0, 1):
            delta = np.abs(np.diff(signal, axis=axis))
            for phase in range(8):
                output.append(np.take(delta, range(phase, CROP_SIZE - 1, 8), axis=axis).mean())
            output.extend(np.quantile(delta, [.25, .5, .75, .95, .99]))
    return np.asarray(output, dtype=np.float32)


def extract_image(image):
    image = ImageOps.exif_transpose(image).convert("RGB")
    if min(image.size) < CROP_SIZE:
        image = ImageOps.pad(image, (CROP_SIZE, CROP_SIZE), Image.Resampling.BILINEAR)
    width, height = image.size
    patches = []
    for fraction in (.2, .5, .8):
        x = round((width - CROP_SIZE) * fraction)
        y = round((height - CROP_SIZE) * fraction)
        crop = image.crop((x, y, x + CROP_SIZE, y + CROP_SIZE))
        patches.append(patch_features(np.asarray(crop, dtype=np.float32) / 255))
    return np.concatenate((np.mean(patches, axis=0), np.std(patches, axis=0)))


def extract_path(path, quality=None):
    with Image.open(path) as image:
        if quality is None:
            return extract_image(image)
        with BytesIO() as encoded:
            ImageOps.exif_transpose(image).convert("RGB").save(encoded, format="JPEG", quality=quality)
            encoded.seek(0)
            with Image.open(encoded) as recompressed:
                return extract_image(recompressed)


def feature_matrix(frame, quality=None):
    with ThreadPoolExecutor(max_workers=4) as pool:
        return np.stack(list(pool.map(lambda path: extract_path(path, quality), frame.path)))


def candidate_models():
    return {
        "logistica": make_pipeline(StandardScaler(), LogisticRegression(C=.1, max_iter=1000)),
        "svm": make_pipeline(StandardScaler(), SVC(C=2)),
        "extra_trees": ExtraTreesClassifier(
            n_estimators=300, min_samples_leaf=3, random_state=SEED, n_jobs=4,
        ),
    }


def score(model, features):
    if hasattr(model, "decision_function"):
        return model.decision_function(features)
    return model.predict_proba(features)[:, 1]


def choose_threshold(labels, scores):
    fpr, tpr, thresholds = roc_curve(labels, scores, drop_intermediate=False)
    finite = np.flatnonzero(np.isfinite(thresholds))
    return float(thresholds[max(finite, key=lambda i: tpr[i] - fpr[i])])


def evaluate(labels, scores, threshold):
    predictions = scores >= threshold
    tn, fp, fn, tp = confusion_matrix(labels, predictions, labels=[0, 1]).ravel()
    return {
        "accuracy": float((predictions == labels).mean()),
        "balanced_accuracy": float(balanced_accuracy_score(labels, predictions)),
        "auc_roc": float(roc_auc_score(labels, scores)),
        "f1_score": float(f1_score(labels, predictions, zero_division=0)),
        "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp),
    }


def main():
    development = inventory(Path("GenImage/Tiny-GenImage/train"))
    train, valid = train_test_split(
        development, test_size=.2, stratify=development.label, random_state=SEED,
    )
    print(f"Desarrollo: {len(train)} entrenamiento, {len(valid)} validacion", flush=True)
    train_x, valid_x = feature_matrix(train), feature_matrix(valid)

    models = candidate_models()
    candidate_auc = {}
    for name, model in models.items():
        model.fit(train_x, train.label)
        candidate_auc[name] = float(roc_auc_score(valid.label, score(model, valid_x)))
    name = max(candidate_auc, key=candidate_auc.get)
    model = models[name]
    threshold = choose_threshold(valid.label, score(model, valid_x))
    print(f"Seleccion por validacion: {name}, AUC {candidate_auc[name]:.3f}", flush=True)
    test = inventory(Path("GenImage_Prueba_Nueva"))
    old = inventory(Path("GenImage/Tiny-GenImage/val"))
    test = test[~test.sha256.isin(pd.concat([development.sha256, old.sha256]))]
    clean_score = score(model, feature_matrix(test))
    jpeg_score = score(model, feature_matrix(test, quality=85))
    results = {
        "dataset": "TheKernel01/Tiny-GenImage",
        "train_count": len(train), "validation_count": len(valid), "test_count": len(test),
        "validation_auc": candidate_auc, "model": name, "threshold": threshold,
        "test": evaluate(test.label, clean_score, threshold),
        "test_jpeg_85": evaluate(test.label, jpeg_score, threshold),
    }
    out = Path("GenImage_Frecuencias_resultados")
    out.mkdir(exist_ok=True)
    (out / "metricas.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    test.assign(score=clean_score, score_jpeg_85=jpeg_score).to_csv(out / "predicciones.csv", index=False)
    joblib.dump({"model": model, "threshold": threshold}, out / "detector.joblib")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
