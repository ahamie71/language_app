"""Tables de correspondance par langue, une par fichier.

Regroupe ce qui était éparpillé dans la section « Language maps » de app.py :
chaque service (NLLB, Vosk, Coqui TTS) et chaque jeu de libellés (en / fr) a
désormais son propre fichier, pour ajouter ou modifier une langue sans toucher
au reste du code.
"""

from .en import LANG_EN
from .fr import LANG_FR
from .nllb import NLLB_LANG
from .vosk import VOSK_MODELS
from .coqui_tts_models import COQUI_TTS_MODELS

__all__ = ["LANG_EN", "LANG_FR", "NLLB_LANG", "VOSK_MODELS", "COQUI_TTS_MODELS"]
