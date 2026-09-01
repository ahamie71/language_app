"""Transcription vocale via Vosk (local, hors-ligne, CPU)."""

import os
import subprocess

import config
from language import VOSK_MODELS

_models = {}


def _download_model(model_name):
    import zipfile
    import requests as _requests
    os.makedirs(config.VOSK_CACHE_DIR, exist_ok=True)
    zip_path = os.path.join(config.VOSK_CACHE_DIR, model_name + ".zip")
    print(f"⏳ Téléchargement du modèle Vosk {model_name}...")
    r = _requests.get(config.VOSK_BASE_URL + model_name + ".zip", stream=True, timeout=300)
    r.raise_for_status()
    with open(zip_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=1 << 20):
            f.write(chunk)
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(config.VOSK_CACHE_DIR)
    os.remove(zip_path)
    print(f"✅ Modèle Vosk {model_name} prêt")


def _get_model(lang):
    if lang not in _models:
        from vosk import Model
        model_name = VOSK_MODELS.get(lang, VOSK_MODELS["en"])
        model_dir = os.path.join(config.VOSK_CACHE_DIR, model_name)
        if not os.path.isdir(model_dir):
            _download_model(model_name)
        _models[lang] = Model(model_dir)
    return _models[lang]


def _to_wav_pcm16(input_path):
    """Convertit n'importe quel format audio (webm, mp3...) en WAV mono 16kHz PCM16 via ffmpeg."""
    output_path = input_path + "_conv.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-i", input_path, "-ar", "16000", "-ac", "1", "-sample_fmt", "s16", output_path],
        check=True, capture_output=True,
    )
    return output_path


def transcribe(audio_path, lang):
    import wave
    import json as _json
    from vosk import KaldiRecognizer

    wav_path = _to_wav_pcm16(audio_path)
    try:
        import shutil
        shutil.copy(wav_path, "/tmp/last_debug.wav")
        print(f"[vosk] wav size={os.path.getsize(wav_path)} bytes")
        wf = wave.open(wav_path, "rb")
        print(f"[vosk] channels={wf.getnchannels()} rate={wf.getframerate()} width={wf.getsampwidth()} nframes={wf.getnframes()}")
        model = _get_model(lang)
        rec = KaldiRecognizer(model, wf.getframerate())
        texts = []
        while True:
            data = wf.readframes(4000)
            if not data:
                break
            if rec.AcceptWaveform(data):
                piece = _json.loads(rec.Result()).get("text", "")
                print(f"[vosk] partial piece={piece!r}")
                texts.append(piece)
        final_piece = _json.loads(rec.FinalResult()).get("text", "")
        print(f"[vosk] final piece={final_piece!r}")
        texts.append(final_piece)
        return " ".join(t for t in texts if t).strip()
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)
