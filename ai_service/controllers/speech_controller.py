"""/transcribe, /tts, /speak — entree/sortie audio."""

import os
import tempfile
import uuid

from services import transcription, speech


def transcribe(audio_file, language):
    """audio_file : werkzeug FileStorage (ou None)."""
    if not audio_file:
        return {"text": "", "error": "no audio"}

    suffix = os.path.splitext(audio_file.filename or "")[1] or ".webm"
    tmp_path = os.path.join(tempfile.gettempdir(), f"lingua_{uuid.uuid4().hex}{suffix}")
    try:
        audio_file.save(tmp_path)
        size = os.path.getsize(tmp_path)
        print(f"[transcribe] received {size} bytes, filename={audio_file.filename}, content_type={audio_file.content_type}, language={language}")
        text = transcription.transcribe(tmp_path, language)
        print(f"[transcribe] result text={text!r}")
        return {"text": text}
    except Exception as e:
        print(f"Vosk error: {e}")
        return {"text": "", "error": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def prepare_tts(text, language):
    """Retourne (out_path, None) si le WAV est genere, sinon (None, (body, status))."""
    text = (text or "").strip()
    if not text:
        return None, ({"error": "no text"}, 400)

    out_path = os.path.join(tempfile.gettempdir(), f"tts_{uuid.uuid4().hex}.wav")
    try:
        ok = speech.synthesize(text, language, out_path)
    except Exception as e:
        print(f"TTS error: {e}")
        return None, ({"error": str(e)}, 500)

    if not ok:
        return None, ({"error": f"no TTS model for language {language}"}, 503)

    return out_path, None


def speak(text, language):
    """Legacy — conserve pour compatibilite."""
    return {"text": text or "", "language": language or "en", "ready": True}
