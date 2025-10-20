# Whisper Speech-to-Text Service

A FastAPI-based service that provides speech-to-text transcription using OpenAI's Whisper model with automatic language detection.

## Features

- **Automatic Language Detection**: Whisper can detect and transcribe speech in 99+ languages automatically
- **High Accuracy**: Uses OpenAI's Whisper base model for optimal balance of speed and accuracy
- **Multiple Audio Formats**: Supports various audio formats (mp3, wav, m4a, etc.)
- **RESTful API**: Easy-to-use HTTP endpoints
- **CORS Support**: Configured for cross-origin requests

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
python whisper_api.py
```

The service will start on `http://localhost:8001`

## API Endpoints

### Health Check
- **GET** `/health`
- Returns service status

### Transcribe Audio
- **POST** `/transcribe`
- **Parameters**:
  - `file`: Audio file (multipart/form-data)
  - `language`: Optional language code (e.g., 'en', 'es', 'fr')
- **Response**:
```json
{
  "text": "transcribed text",
  "language": "detected_language_code",
  "confidence": 0.95
}
```

### Supported Languages
- **GET** `/supported-languages`
- Returns list of all supported languages

## Usage Example

```bash
curl -X POST "http://localhost:8001/transcribe" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio_file.wav"
```

## Model Information

- **Model**: Whisper base model (~244MB)
- **Languages**: 99+ languages supported
- **Accuracy**: High accuracy with automatic language detection
- **Speed**: Optimized for real-time transcription

## Notes

- The model is loaded once on startup and reused for all requests
- Maximum file size: 25MB
- Supports automatic language detection - no need to specify language
- First request may take longer as the model loads into memory
