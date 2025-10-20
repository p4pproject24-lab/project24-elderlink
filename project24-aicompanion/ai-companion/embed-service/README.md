# User Memory Embedding Service

This FastAPI service allows:
- Storing user-specific memory embeddings
- Retrieving top-k relevant memories using ChromaDB and sentence-transformers

## 🚀 How to Run

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Start the server:

```bash
uvicorn memory_api:app --reload --host 0.0.0.0 --port 8000
```

## 📘 API

### POST /remember

Store a memory for a specific user.

```json
{
  "user_id": "andy",
  "text": "I felt happy yesterday"
}
```

### POST /recall

Retrieve top-k relevant memories for a user.

```json
{
  "user_id": "andy",
  "query": "What did I say about feeling good?",
  "top_k": 3
}
```
