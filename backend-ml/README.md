# TurtleTrack ML Service — `backend-ml`

Production-ready **Sea Turtle Re-Identification** pipeline built with FastAPI,
MobileNetV2, FAISS, and Scikit-learn.

---

## Architecture

```
Upload Image  →  (Optional) Side Selection (AUTO / LEFT / RIGHT)
               ↓
         Species Prediction   (SVM on MobileNetV2 embeddings)
               ↓
       Filter FAISS by Species + Side
               ↓
       Top-3 Individual Matches   (cosine similarity)
               ↓
  Similarity ≥ 80%? → Return Top-3    (matched = true)
           else   → NEW TURTLE ID     (matched = false)
```

---

## Project Structure

```
backend-ml/
├── main.py                          # FastAPI entry point (v2)
├── config.json                      # Runtime config snapshot
├── requirements.txt
│
├── ml/                              # Standalone training + inference scripts
│   ├── generate_embeddings.py       # Step 1: extract MobileNetV2 embeddings
│   ├── train_species_classifier.py  # Step 2: train SVM species classifier
│   ├── build_faiss.py               # Step 3: build species+side FAISS index
│   ├── predict.py                   # End-to-end inference pipeline
│   ├── register.py                  # Register new turtle (no rebuild)
│   └── utils.py                     # Shared helpers
│
├── app/
│   ├── api/routes.py                # FastAPI routes (v1 + v2)
│   ├── config/settings.py           # Pydantic settings
│   ├── models/schemas.py            # Pydantic schemas
│   └── services/
│       ├── predict_service.py       # Singleton wrapping ml/predict.py
│       ├── extraction/              # MobileNetV2 feature extractor
│       ├── matching/                # FAISS index manager (v1 legacy)
│       ├── preprocessing/           # Image preprocessing
│       └── similarity/              # Score classification
│
└── storage/
    ├── models/                      # Trained artefacts (generated)
    │   ├── embeddings.pkl
    │   ├── species_classifier.pkl
    │   └── label_encoder.pkl
    └── index/                       # FAISS index + metadata (generated)
        ├── turtles_v2.index
        └── metadata_store.json
```

---

## Setup

### 1. Create & activate virtual environment

```powershell
# Windows
cd backend-ml
python -m venv .venv
.venv\Scripts\Activate.ps1

# macOS / Linux
python -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

---

## Training Pipeline

Run **from the `backend-ml/` directory** in order:

### Step 1 — Generate embeddings

Extracts MobileNetV2 (1280-dim) embeddings for all 8 729 dataset images.
Also infers LEFT / RIGHT / UNKNOWN side per image using brightness heuristic.

```powershell
python ml/generate_embeddings.py
# Output: storage/models/embeddings.pkl  (~350 MB)
# Time:   ~10-30 min (CPU) / ~3-5 min (GPU)
```

### Step 2 — Train species classifier

Trains an RBF-SVM on per-identity averaged embeddings.

```powershell
python ml/train_species_classifier.py
# Output: storage/models/species_classifier.pkl
#         storage/models/label_encoder.pkl
# Time:   ~2-5 min
```

### Step 3 — Build FAISS index

Builds a species+side-aware FAISS index with full per-slot metadata.

```powershell
python ml/build_faiss.py
# Output: storage/index/turtles_v2.index
#         storage/index/metadata_store.json
# Time:   ~30 sec
```

---

## Running the API Server

```powershell
cd backend-ml
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive docs: http://localhost:8000/docs

---

## API Reference

### `POST /predict` ⭐ Primary endpoint

Identify a turtle from an uploaded image.

**Request** — `multipart/form-data`

| Field        | Type   | Required | Description                    |
|--------------|--------|----------|--------------------------------|
| `image`      | file   | ✅       | JPEG / PNG / WEBP image        |
| `image_side` | string | ❌       | `AUTO` (default) \| `LEFT` \| `RIGHT` |

**Matched response** (`matched: true`):

```json
{
  "matched": true,
  "predicted_species": "Green Sea turtle",
  "species_confidence": 94.31,
  "image_side": "LEFT",
  "top_matches": [
    { "identity": "t023", "similarity": 97.83, "species": "Green Sea turtle",
      "first_seen": 2015, "latest_seen": 2021, "location": "Alibaug" },
    { "identity": "t018", "similarity": 95.42, "species": "Green Sea turtle",
      "first_seen": 2016, "latest_seen": 2022, "location": "Murud" },
    { "identity": "t041", "similarity": 91.88, "species": "Green Sea turtle",
      "first_seen": 2014, "latest_seen": 2020, "location": "Kelva" }
  ]
}
```

**New turtle response** (`matched: false`):

```json
{
  "matched": false,
  "predicted_species": "Hawksbill",
  "species_confidence": 88.12,
  "image_side": "RIGHT",
  "message": "NEW TURTLE DETECTED",
  "new_identity": "t439"
}
```

---

### `POST /register_new_turtle`

Register a newly discovered turtle into the live FAISS index. **No retraining required.**

**Request** — `multipart/form-data`

| Field        | Type    | Required | Description              |
|--------------|---------|----------|--------------------------|
| `image`      | file    | ✅       | Turtle image             |
| `identity`   | string  | ✅       | New ID (e.g. `t439`)     |
| `species`    | string  | ✅       | Species name             |
| `image_side` | string  | ❌       | `AUTO` \| `LEFT` \| `RIGHT` |
| `location`   | string  | ❌       | Location string          |
| `year`       | integer | ❌       | Year of sighting         |

---

### `GET /ml/health`

Returns status of all components:

```json
{
  "status": "operational",
  "model_loaded": true,
  "classifier_loaded": true,
  "faiss_v2_loaded": true,
  "faiss_v2_size": 8729,
  "model_name": "mobilenet_v2",
  "embedding_dim": 1280,
  "similarity_threshold": 0.8,
  "timestamp": "2025-01-01T00:00:00+00:00"
}
```

### `GET /ml/stats`

```json
{
  "total_species": 5,
  "total_identities": 438,
  "total_embeddings": 8729,
  "faiss_v2_index_size": 8729,
  "model_name": "mobilenet_v2",
  "embedding_dim": 1280,
  "similarity_threshold": 0.8
}
```

---

### Legacy endpoints (v1)

| Method | Endpoint               | Description                            |
|--------|------------------------|----------------------------------------|
| POST   | `/ml/identify`         | Basic FAISS search (no species filter) |
| POST   | `/ml/register`         | Register embedding (v1 index)          |
| DELETE | `/ml/embeddings/{id}`  | Logical delete from v1 index           |

---

## CLI Tools

### Quick prediction test

```powershell
python ml/predict.py path/to/turtle.jpg AUTO
python ml/predict.py path/to/turtle.jpg LEFT
```

### Register a new turtle from CLI

```powershell
python ml/register.py path/to/image.jpg t439 "Hawksbill" LEFT "Alibaug" 2025
```

---

## Configuration

Key settings in `app/config/settings.py` (override via `.env`):

| Variable                   | Default | Description                         |
|----------------------------|---------|-------------------------------------|
| `NEW_TURTLE_THRESHOLD`     | 0.80    | Similarity below this = new turtle  |
| `TOP_K_MATCHES`            | 3       | Number of top matches returned      |
| `ML_MODEL_NAME`            | `mobilenet_v2` | Backbone name             |
| `ML_EMBEDDING_DIM`         | 1280    | Embedding dimension                 |
| `ML_PORT`                  | 8000    | FastAPI server port                 |

---

## Dataset

```
dataset/turtles-data/data/
├── metadata_splits.csv    # 8729 rows: identity, turtle_type, year, location, ...
└── images/
    ├── t001/
    │   ├── CAluWEgwPX.JPG
    │   └── ...
    ├── t002/
    └── ...
```

**Species:** Leatherback (2113), Olive Ridley (1851), Hawksbill (1809),
Green Sea turtle (1481), Loggerhead (1475)  
**Identities:** 438 unique turtles  
**Years:** 2010 – 2022  

---

## Integration with TurtleTrack App

The full data flow for a live identification:

```
[Frontend (Expo)]
  Upload image + image_side
        ↓ POST /api/sightings/identify  (multipart)
[backend-node (Express)]
  Saves image → calls MLService.predict()
        ↓ POST /predict  (multipart)
[backend-ml (FastAPI)]
  Returns PredictMatchedResponse | PredictNewTurtleResponse
        ↑
[backend-node]
  Maps v2 response → IdentifyResult → returns to app
        ↑
[Frontend]
  Displays Top-3 matches or NEW TURTLE banner
```
