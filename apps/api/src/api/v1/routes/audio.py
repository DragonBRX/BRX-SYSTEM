"""
BRX SYSTEM - Audio API Routes
Speech processing endpoints
"""

from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"
    engine: str = "edge"


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech."""
    try:
        import tempfile

        if request.engine == "edge":
            from packages.audio.src.tts.synthesis import EdgeTTS
            tts = EdgeTTS()
        elif request.engine == "coqui":
            from packages.audio.src.tts.synthesis import CoquiTTS
            tts = CoquiTTS()
        else:
            from packages.audio.src.tts.synthesis import SystemTTS
            tts = SystemTTS()

        output_path = tempfile.mktemp(suffix=".mp3")
        result = await tts.synthesize(request.text, output_path, request.voice)

        return {
            "audio_path": result.audio_path,
            "text": result.text,
            "sample_rate": result.sample_rate,
            "model": result.model,
            "inference_time_ms": result.inference_time_ms,
        }
    except Exception as e:
        logger.error("tts_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stt")
async def speech_to_text(
    file: UploadFile = File(...),
    model: str = Form("base"),
    language: Optional[str] = Form(None),
):
    """Transcribe audio to text."""
    try:
        import tempfile
        from packages.audio.src.stt.recognition import WhisperRecognizer

        temp_path = tempfile.mktemp(suffix=".wav")
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        recognizer = WhisperRecognizer(model)
        result = recognizer.transcribe(temp_path, language)

        return {
            "text": result.text,
            "language": result.language,
            "segments": result.segments,
            "model": result.model,
            "inference_time_ms": result.inference_time_ms,
        }
    except Exception as e:
        logger.error("stt_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
