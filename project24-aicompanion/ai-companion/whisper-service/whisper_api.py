from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import whisper
import tempfile
import os
import logging
import base64
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Whisper Speech-to-Text Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the Whisper model
whisper_model = None

class TranscriptionResponse(BaseModel):
    text: str
    language: str
    confidence: Optional[float] = None

class Base64TranscriptionRequest(BaseModel):
    audio_data: str
    filename: str

def load_whisper_model():
    """Load the Whisper model globally to avoid reloading on each request"""
    global whisper_model
    if whisper_model is None:
        logger.info("Loading Whisper model...")
        try:
            # Use the tiny model for minimal disk space usage
            # Options: tiny (39MB), base (244MB), small (769MB), medium (1.5GB), large (3.1GB)
            whisper_model = whisper.load_model("tiny")
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading Whisper model: {e}")
            raise HTTPException(status_code=500, detail="Failed to load Whisper model")
    return whisper_model

@app.on_event("startup")
async def startup_event():
    """Load the Whisper model on startup"""
    load_whisper_model()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "whisper-api"}

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = None
):
    """
    Transcribe audio file using Whisper with automatic language detection

    Args:
        file: Audio file (supports various formats: mp3, wav, m4a, etc.)
        language: Optional language code (e.g., 'en', 'es', 'fr') for faster processing

    Returns:
        TranscriptionResponse with text, detected language, and confidence
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Check file size (limit to 25MB)
        file_size = 0
        content = await file.read()
        file_size = len(content)

        if file_size > 25 * 1024 * 1024:  # 25MB limit
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 25MB")

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Load model if not already loaded
            model = load_whisper_model()

            # Transcribe with automatic language detection
            logger.info(f"Transcribing audio file: {file.filename}")

            # Set transcription options
            options = {
                "task": "transcribe",
                "fp16": False  # Use fp32 for better compatibility
            }

            # If language is provided, use it for faster processing
            if language:
                options["language"] = language
                logger.info(f"Using specified language: {language}")

            # Perform transcription
            result = model.transcribe(temp_file_path, **options)

            # Extract results
            transcribed_text = result["text"].strip()
            detected_language = result.get("language", "unknown")

            # Get confidence if available (segments might have confidence scores)
            confidence = None
            if "segments" in result and result["segments"]:
                # Calculate average confidence from segments
                confidences = [seg.get("avg_logprob", 0) for seg in result["segments"] if seg.get("avg_logprob")]
                if confidences:
                    confidence = sum(confidences) / len(confidences)

            logger.info(f"Transcription completed. Language: {detected_language}, Text length: {len(transcribed_text)}")

            return TranscriptionResponse(
                text=transcribed_text,
                language=detected_language,
                confidence=confidence
            )

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        logger.error(f"Error during transcription: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/transcribe-base64", response_model=TranscriptionResponse)
async def transcribe_audio_base64(request: Base64TranscriptionRequest):
    """
    Transcribe base64 encoded audio data using Whisper with automatic language detection

    Args:
        request: Base64TranscriptionRequest with audio_data and filename

    Returns:
        TranscriptionResponse with text, detected language, and confidence
    """
    try:
        # Validate request
        if not request.audio_data:
            raise HTTPException(status_code=400, detail="No audio data provided")

        # Decode base64 audio data
        try:
            audio_bytes = base64.b64decode(request.audio_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 data: {str(e)}")

        # Check file size (limit to 25MB)
        if len(audio_bytes) > 25 * 1024 * 1024:  # 25MB limit
            raise HTTPException(status_code=400, detail="Audio data too large. Maximum size is 25MB")

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{request.filename.split('.')[-1]}") as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name

        try:
            # Load model if not already loaded
            model = load_whisper_model()

            # Transcribe with automatic language detection
            logger.info(f"Transcribing base64 audio data: {request.filename}")

            # Set transcription options
            options = {
                "task": "transcribe",
                "fp16": False  # Use fp32 for better compatibility
            }

            # Perform transcription
            result = model.transcribe(temp_file_path, **options)

            # Extract results
            transcribed_text = result["text"].strip()
            detected_language = result.get("language", "unknown")

            # Get confidence if available (segments might have confidence scores)
            confidence = None
            if "segments" in result and result["segments"]:
                # Calculate average confidence from segments
                confidences = [seg.get("avg_logprob", 0) for seg in result["segments"] if seg.get("avg_logprob")]
                if confidences:
                    confidence = sum(confidences) / len(confidences)

            logger.info(f"Base64 transcription completed. Language: {detected_language}, Text length: {len(transcribed_text)}")

            return TranscriptionResponse(
                text=transcribed_text,
                language=detected_language,
                confidence=confidence
            )

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        logger.error(f"Error during base64 transcription: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported languages by Whisper"""
    # Whisper supports 99 languages
    languages = {
        "en": "English",
        "es": "Spanish",
        "fr": "French",
        "de": "German",
        "it": "Italian",
        "pt": "Portuguese",
        "ru": "Russian",
        "ja": "Japanese",
        "ko": "Korean",
        "zh": "Chinese",
        "hi": "Hindi",
        "ar": "Arabic",
        "tr": "Turkish",
        "pl": "Polish",
        "nl": "Dutch",
        "sv": "Swedish",
        "no": "Norwegian",
        "da": "Danish",
        "fi": "Finnish",
        "cs": "Czech",
        "hu": "Hungarian",
        "ro": "Romanian",
        "bg": "Bulgarian",
        "hr": "Croatian",
        "sk": "Slovak",
        "sl": "Slovenian",
        "et": "Estonian",
        "lv": "Latvian",
        "lt": "Lithuanian",
        "mt": "Maltese",
        "el": "Greek",
        "he": "Hebrew",
        "th": "Thai",
        "vi": "Vietnamese",
        "id": "Indonesian",
        "ms": "Malay",
        "tl": "Filipino",
        "bn": "Bengali",
        "ur": "Urdu",
        "fa": "Persian",
        "sw": "Swahili",
        "af": "Afrikaans",
        "is": "Icelandic",
        "ga": "Irish",
        "cy": "Welsh",
        "eu": "Basque",
        "ca": "Catalan",
        "gl": "Galician",
        "sq": "Albanian",
        "mk": "Macedonian",
        "sr": "Serbian",
        "bs": "Bosnian",
        "me": "Montenegrin",
        "uk": "Ukrainian",
        "be": "Belarusian",
        "kk": "Kazakh",
        "ky": "Kyrgyz",
        "uz": "Uzbek",
        "tg": "Tajik",
        "mn": "Mongolian",
        "ka": "Georgian",
        "hy": "Armenian",
        "az": "Azerbaijani",
        "ku": "Kurdish",
        "ps": "Pashto",
        "sd": "Sindhi",
        "ne": "Nepali",
        "si": "Sinhala",
        "my": "Myanmar",
        "km": "Khmer",
        "lo": "Lao",
        "bo": "Tibetan",
        "dz": "Dzongkha",
        "am": "Amharic",
        "ti": "Tigrinya",
        "so": "Somali",
        "ha": "Hausa",
        "yo": "Yoruba",
        "ig": "Igbo",
        "zu": "Zulu",
        "xh": "Xhosa",
        "st": "Sesotho",
        "tn": "Tswana",
        "sn": "Shona",
        "rw": "Kinyarwanda",
        "lg": "Ganda",
        "ak": "Akan",
        "tw": "Twi",
        "ee": "Ewe",
        "fon": "Fon",
        "wo": "Wolof",
        "ff": "Fula",
        "bm": "Bambara",
        "dy": "Dyula",
        "sg": "Sango",
        "ln": "Lingala",
        "sw": "Swahili",
        "mg": "Malagasy",
        "mt": "Maltese",
        "co": "Corsican",
        "sc": "Sardinian",
        "fur": "Friulian",
        "rm": "Romansh",
        "lb": "Luxembourgish",
        "als": "Alemannic",
        "bar": "Bavarian",
        "pdc": "Pennsylvania German",
        "yue": "Cantonese",
        "nan": "Min Nan",
        "hak": "Hakka",
        "gan": "Gan",
        "wuu": "Wu",
        "hsn": "Xiang",
        "cjy": "Jinyu",
        "cmn": "Mandarin",
        "lzh": "Classical Chinese"
    }

    return {
        "languages": languages,
        "total_count": len(languages),
        "note": "Whisper supports automatic language detection for all these languages"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
