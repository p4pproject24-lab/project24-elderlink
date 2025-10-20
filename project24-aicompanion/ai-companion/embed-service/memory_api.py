from fastapi import FastAPI
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
import chromadb
from uuid import uuid4
from typing import Optional
from datetime import datetime, timedelta, timezone

# Persistent ChromaDB
client = chromadb.PersistentClient(path="./chroma-memory")
model = SentenceTransformer("all-MiniLM-L6-v2")
app = FastAPI()

class RecallInput(BaseModel):
    user_id: str
    query: str
    top_k: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class MemoryInput(BaseModel):
    user_id: str
    text: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@app.post("/remember")
def remember(data: MemoryInput):
    print("calling remember")
    collection = client.get_or_create_collection(name=f"user_{data.user_id}")
    embedding = model.encode(data.text).tolist()
    collection.add(
        documents=[data.text],
        embeddings=[embedding],
        metadatas=[{
            "user_id": data.user_id,
            "timestamp": data.timestamp.isoformat()
        }],
        ids=[str(uuid4())]
    )
    return {"status": "stored"}

    
@app.post("/recall")
def recall(data: RecallInput):
    print("calling recall")
    collection = client.get_or_create_collection(name=f"user_{data.user_id}")
    query_vec = model.encode(data.query).tolist()

    filters = {}

    # Only filter by timestamp if provided
    if data.start_time or data.end_time:
        time_filter = {}
        if data.start_time:
            time_filter["$gte"] = data.start_time.isoformat()
        if data.end_time:
            time_filter["$lte"] = data.end_time.isoformat()
        filters["where"] = {"timestamp": time_filter}

    # Step 1: Query more than you need (up to 50), then filter manually
    query_args = {
        "query_embeddings": [query_vec],
        "n_results": 50,
        "include": ["documents", "metadatas", "distances"]
    }

    if "where" in filters:
        query_args["where"] = filters["where"]

    results = collection.query(**query_args)

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    SIMILARITY_THRESHOLD = 0.3  # 1 - cosine distance must be ≥ 0.3

    # Step 2: Filter by similarity score, and return top 10
    combined = [
        {
            "text": doc,
            "timestamp": meta.get("timestamp", "unknown"),
            "similarity": 1 - dist
        }
        for doc, meta, dist in zip(docs, metas, distances)
        if (1 - dist) >= SIMILARITY_THRESHOLD
    ]

    top_10 = sorted(combined, key=lambda x: -x["similarity"])[:10]

    return {"related_memories": top_10 if top_10 else "none"}