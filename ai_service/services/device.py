"""Selection du device (CPU / GPU) par role de modele.

Rien n'est code en dur : la decision se fait a l'execution selon la VRAM
disponible, et reste surchargeable par variable d'environnement :

    DEVICE_NLLB=cpu     # force NLLB sur CPU meme si un GPU est present
    DEVICE_TTS=cuda     # force Coqui TTS sur GPU

Le LLM tourne dans Ollama (process separe) : il n'est pas concerne ici.
"""

import functools
import os


@functools.lru_cache(maxsize=1)
def cuda_vram_gb():
    """VRAM du GPU 0 en Go, ou 0.0 si pas de CUDA disponible."""
    try:
        import torch
        if not torch.cuda.is_available():
            return 0.0
        return torch.cuda.get_device_properties(0).total_memory / 1e9
    except Exception:
        return 0.0


def device_for(role):
    """'cuda' ou 'cpu' pour un role donne ('nllb', 'tts', 'intent')."""
    override = os.getenv(f"DEVICE_{role.upper()}")
    if override:
        return override.lower()

    vram = cuda_vram_gb()
    if vram <= 0:
        return "cpu"

    # NLLB-600M (~1,5 Go fp16) : sur GPU seulement s'il reste de la marge
    # apres Ollama (qui monopolise la VRAM sur les cartes 8 Go). En dessous
    # de 12 Go on laisse NLLB sur CPU (~1-2 s/phrase, acceptable).
    if role == "nllb":
        return "cuda" if vram >= 12 else "cpu"

    # intent (trivial) et TTS (~1-2 s CPU) : CPU par defaut.
    return "cpu"
