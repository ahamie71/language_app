"""Synthese vocale (TTS) via Coqui TTS — un modele VITS par langue, CPU."""

from language import COQUI_TTS_MODELS
from services.device import device_for

_engines = {}


def _get_engine(lang):
    if lang not in _engines:
        from TTS.api import TTS
        model_name = COQUI_TTS_MODELS.get(lang)
        if not model_name:
            return None
        use_gpu = device_for("tts") == "cuda"
        print(f"⏳ Chargement de Coqui TTS ({model_name}, gpu={use_gpu})...")
        _engines[lang] = TTS(model_name, progress_bar=False, gpu=use_gpu)
        print("✅ Coqui TTS chargé")
    return _engines[lang]


def synthesize(text, lang, out_path):
    """Ecrit le WAV dans out_path. Retourne False si pas de modele pour `lang`."""
    engine = _get_engine(lang)
    if not engine:
        return False
    engine.tts_to_file(text=text, file_path=out_path)
    return True
