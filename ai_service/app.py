"""Point d'entree du service IA de LinguaAI.

Architecture (voir les sous-dossiers) :
  - language/     : tables de correspondance par langue (une par fichier)
  - services/     : acces aux modeles (LLM Ollama, NLLB, Vosk, Coqui TTS, intent)
  - controllers/  : logique metier (prompts, repli, validation)
  - routes/       : blueprints Flask, fins — parsing de requete + jsonify

Modeles :
  - Traduction            : NLLB-200-distilled-600M (Meta), local CPU
  - Explications/chat/QCM  : LLM via Ollama (modele derive `lingua-llm`)
  - Transcription vocale   : Vosk (un petit modele par langue, a la demande)
  - Lecture (TTS)          : Coqui TTS (un modele par langue), local CPU

Demarrage silencieux : un thread de fond precharge NLLB + le classifieur
d'intention EN RAM (pas de VRAM). Le GPU n'est sollicite qu'a la 1re requete.
"""

import threading

from flask import Flask
from flask_cors import CORS

import config
from routes import register_routes


def _silent_preload():
    try:
        from services import translation, intent
        translation.warmup()
        intent.warmup()
        print("✅ Préchargement silencieux terminé (NLLB + intent en RAM)")
    except Exception as e:
        print(f"Preload warning: {e}")


def create_app():
    app = Flask(__name__)
    CORS(app)
    register_routes(app)
    threading.Thread(target=_silent_preload, name="preload", daemon=True).start()
    return app


app = create_app()


if __name__ == "__main__":
    print(f"🚀 AI Service on port {config.PORT} — LLM via Ollama ({config.LLM_MODEL}), NLLB-200, Vosk, Coqui TTS")
    app.run(host="0.0.0.0", port=config.PORT, debug=False)
