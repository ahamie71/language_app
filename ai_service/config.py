"""Configuration centralisee — lue depuis l'environnement (.env)."""

import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 5000))

# ── LLM via Ollama ────────────────────────────────────────────────────────────
OLLAMA_URL = os.getenv("AI_OLLAMA_URL", "http://localhost:11434")
LLM_MODEL  = os.getenv("LLM_MODEL", "lingua-llm")

# ── Traduction (NLLB-200) ─────────────────────────────────────────────────────
NLLB_MODEL = os.getenv("NLLB_MODEL", "facebook/nllb-200-distilled-600M")

# ── Transcription (Vosk) ──────────────────────────────────────────────────────
VOSK_CACHE_DIR = os.getenv("VOSK_CACHE_DIR", "/root/.cache/vosk")
VOSK_BASE_URL  = "https://alphacephei.com/vosk/models/"

# ── Classifieur d'intention (modele maison) ───────────────────────────────────
INTENT_MODEL_DIR = os.getenv(
    "INTENT_MODEL_DIR", os.path.join(os.path.dirname(__file__), "models")
)
