from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import random
import signal
import sys
import openai

load_dotenv()

app = Flask(__name__)
CORS(app)

# =========================
# CONFIGURATION
# =========================

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
USE_FREE_API = os.getenv('USE_FREE_API', 'true').lower() == 'true'

if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
    print("✅ OpenAI API configured")
else:
    print("⚠️ No OpenAI API key - using free APIs only")

# =========================
# APIs gratuites
# =========================

LIBRETRANSLATE_URL = "https://libretranslate.com/translate"
MYMEMORY_URL = "https://api.mymemory.translated.net/get"

# =========================
# LANGUAGES
# =========================

LANG_CODES = {
    'fr': 'French',
    'en': 'English',
    'es': 'Spanish',
    'de': 'German',
    'ar': 'Arabic',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'ja': 'Japanese'
}

LIBRE_LANG_CODES = {
    'fr': 'fr',
    'en': 'en',
    'es': 'es',
    'de': 'de',
    'ar': 'ar',
    'it': 'it',
    'pt': 'pt',
    'zh': 'zh',
    'ja': 'ja'
}

# =========================
# GRACEFUL SHUTDOWN (DOCKER)
# =========================

def handle_sigterm(*args):
    print("🛑 SIGTERM received - shutting down AI service")
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)

# =========================
# MOCK FUNCTIONS
# =========================

def mock_translate(text, source_lang, target_lang):
    return f"[Mock translation] {text}"

def translate_with_libretranslate(text, source_lang, target_lang):
    try:
        payload = {
            "q": text,
            "source": LIBRE_LANG_CODES.get(source_lang, "en"),
            "target": LIBRE_LANG_CODES.get(target_lang, "en"),
            "format": "text"
        }

        response = requests.post(LIBRETRANSLATE_URL, json=payload, timeout=10)

        if response.status_code == 200:
            return response.json().get("translatedText", mock_translate(text, source_lang, target_lang))

    except Exception as e:
        print(f"LibreTranslate error: {e}")

    return mock_translate(text, source_lang, target_lang)


def translate_with_mymemory(text, source_lang, target_lang):
    try:
        lang_pair = f"{LIBRE_LANG_CODES.get(source_lang,'en')}|{LIBRE_LANG_CODES.get(target_lang,'en')}"

        response = requests.get(
            MYMEMORY_URL,
            params={"q": text, "langpair": lang_pair},
            timeout=10
        )

        if response.status_code == 200:
            return response.json().get("responseData", {}).get("translatedText",
                    mock_translate(text, source_lang, target_lang))

    except Exception as e:
        print(f"MyMemory error: {e}")

    return mock_translate(text, source_lang, target_lang)

# =========================
# AI RESPONSES
# =========================

def mock_respond(user_message, target_language):
    responses = {
        "en": [
            "Great! Keep practicing 👍",
            "Nice work! Tell me more.",
            "Good sentence! Try another one."
        ],
        "fr": [
            "Très bien 👍 continue comme ça",
            "Excellent ! Dis-m'en plus",
            "Bonne phrase ! Essaie encore"
        ]
    }

    return random.choice(responses.get(target_language, responses["en"]))

# =========================
# ROUTES
# =========================

@app.route("/translate", methods=["POST"])
def translate():
    data = request.json

    text = data.get("text", "")
    source_lang = data.get("source_lang", "en")
    target_lang = data.get("target_lang", "fr")

    if USE_FREE_API:
        translation = translate_with_libretranslate(text, source_lang, target_lang)
    else:
        translation = mock_translate(text, source_lang, target_lang)

    return jsonify({
        "translation": translation,
        "source_lang": source_lang,
        "target_lang": target_lang
    })


@app.route("/speak", methods=["POST"])
def speak():
    data = request.json
    return jsonify({
        "text": data.get("text", ""),
        "language": data.get("language", "en")
    })


@app.route("/explain", methods=["POST"])
def explain():
    data = request.json

    return jsonify({
        "explanation": f"Explanation for: {data.get('text','')}",
        "level": data.get("level", "beginner")
    })


@app.route("/respond", methods=["POST"])
def respond():
    data = request.json

    response = mock_respond(
        data.get("user_message", ""),
        data.get("target_language", "en")
    )

    return jsonify({
        "response": response
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "ai-service"
    })

# =========================
# START SERVER (DOCKER SAFE)
# =========================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))

    print(f"🤖 AI Service running on port {port}")

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )