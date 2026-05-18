from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── Config ─────────────────────────────────────────────────────────────────────

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

USE_AI = False
client = None

if OPENAI_API_KEY and not OPENAI_API_KEY.startswith("sk-your"):
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        USE_AI = True
        print("✅ OpenAI GPT-4o-mini enabled")
    except Exception as e:
        print(f"⚠️  OpenAI init failed: {e}")
else:
    print("⚠️  No valid OpenAI key — running in fallback mode")

# ── Language maps ───────────────────────────────────────────────────────────────

LANG_EN = {
    "fr": "French", "en": "English", "es": "Spanish", "de": "German",
    "ar": "Arabic", "it": "Italian", "pt": "Portuguese", "zh": "Chinese", "ja": "Japanese",
}

LANG_FR = {
    "fr": "français", "en": "anglais", "es": "espagnol", "de": "allemand",
    "ar": "arabe",    "it": "italien", "pt": "portugais", "zh": "chinois",  "ja": "japonais",
}

# ── AI helper ──────────────────────────────────────────────────────────────────

def ai(messages, max_tokens=500, temperature=0.7):
    """Call OpenAI and return the text, or None on failure."""
    if not USE_AI or not client:
        return None
    try:
        res = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI error: {e}")
        return None

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "ai": USE_AI})


@app.route("/translate", methods=["POST"])
def translate():
    data        = request.json or {}
    text        = data.get("text", "").strip()
    source_lang = data.get("source_lang", "fr")
    target_lang = data.get("target_lang", "en")

    if not text:
        return jsonify({"translation": ""})

    src_name = LANG_EN.get(source_lang, source_lang)
    tgt_name = LANG_EN.get(target_lang, target_lang)

    result = ai([
        {
            "role": "system",
            "content": (
                f"You are a professional translator. "
                f"Translate the following text from {src_name} to {tgt_name}. "
                f"Return ONLY the translation — no explanations, no quotes, no extra text."
            ),
        },
        {"role": "user", "content": text},
    ], max_tokens=400, temperature=0.3)

    if not result:
        result = f"[{tgt_name}] {text}"

    return jsonify({"translation": result})


@app.route("/explain", methods=["POST"])
def explain():
    data     = request.json or {}
    text     = data.get("text", "").strip()
    language = data.get("language", "en")
    level    = data.get("level", "debutant")

    if not text:
        return jsonify({"explanation": ""})

    lang_name  = LANG_EN.get(language, language)
    level_desc = {"debutant": "beginner", "intermediaire": "intermediate", "avance": "advanced"}.get(level, level)

    result = ai([
        {
            "role": "system",
            "content": (
                f"You are a friendly language coach who helps people learn {lang_name}. "
                f"The learner is at {level_desc} level. "
                f"Analyze the following {lang_name} text and provide a concise explanation in FRENCH that covers: "
                f"key vocabulary, grammar points, and any cultural context. "
                f"Keep it encouraging and easy to understand. Maximum 4 sentences."
            ),
        },
        {"role": "user", "content": text},
    ], max_tokens=350)

    if not result:
        tgt_fr = LANG_FR.get(language, language)
        result = (
            f"Texte en {tgt_fr} analysé. "
            f"Pour des explications détaillées, configurez une clé OpenAI valide."
        )

    return jsonify({"explanation": result})


@app.route("/respond", methods=["POST"])
def respond():
    data        = request.json or {}
    user_msg    = data.get("user_message", "").strip()
    history     = data.get("conversation_history", [])
    target_lang = data.get("target_language", "en")
    level       = data.get("level", "debutant")

    if not user_msg:
        return jsonify({"response": "Bonjour ! Comment puis-je vous aider ?"})

    lang_name  = LANG_EN.get(target_lang, target_lang)
    level_desc = {"debutant": "beginner", "intermediaire": "intermediate", "avance": "advanced"}.get(level, "beginner")

    complexity = {
        "debutant":      "Use very simple vocabulary and short sentences (A1-A2 level). Avoid complex grammar.",
        "intermediaire": "Use intermediate vocabulary and varied sentence structures (B1-B2 level).",
        "avance":        "Use rich vocabulary, idiomatic expressions and complex structures (C1-C2 level).",
    }.get(level, "Use simple vocabulary.")

    messages = [
        {
            "role": "system",
            "content": (
                f"You are Lingua Coach, a warm and encouraging language learning assistant. "
                f"The user is a {level_desc} learner of {lang_name}. "
                f"Always respond ONLY in {lang_name} — never switch languages. "
                f"{complexity} "
                f"Keep responses natural and conversational (2-3 sentences max). "
                f"If the user makes a grammar mistake, gently model the correct form in your reply."
            ),
        }
    ]

    for h in history[-6:]:
        if isinstance(h, dict) and h.get("role") in ("user", "assistant") and h.get("content"):
            messages.append({"role": h["role"], "content": h["content"]})

    messages.append({"role": "user", "content": user_msg})

    result = ai(messages, max_tokens=200, temperature=0.8)

    if not result:
        tgt_fr = LANG_FR.get(target_lang, target_lang)
        result = f"Je comprends ! Pour des réponses en {tgt_fr}, ajoutez une clé API OpenAI valide."

    return jsonify({"response": result})


@app.route("/transcribe", methods=["POST"])
def transcribe():
    """3.3.1 — Retranscription via OpenAI Whisper."""
    audio_file = request.files.get("audio")
    if not audio_file:
        return jsonify({"text": "", "error": "no audio"})
    if not USE_AI:
        return jsonify({"text": "", "error": "AI not configured"})
    try:
        result = client.audio.transcriptions.create(
            model="whisper-1",
            file=(audio_file.filename or "audio.webm", audio_file.stream, audio_file.content_type or "audio/webm"),
        )
        return jsonify({"text": result.text})
    except Exception as e:
        print(f"Whisper error: {e}")
        return jsonify({"text": "", "error": str(e)})


@app.route("/tts", methods=["POST"])
def tts():
    """3.3.3 — Lecture de la traduction via OpenAI TTS."""
    data = request.json or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "no text"}), 400
    if not USE_AI:
        return jsonify({"error": "AI not configured"}), 503
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=text,
        )
        return Response(
            response.content,
            mimetype="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"},
        )
    except Exception as e:
        print(f"TTS error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/speak", methods=["POST"])
def speak():
    """Legacy — kept for compatibility."""
    data = request.json or {}
    return jsonify({
        "text":     data.get("text", ""),
        "language": data.get("language", "en"),
        "ready":    True,
    })


@app.route("/exercise", methods=["POST"])
def exercise():
    """Génère un exercice QCM dans la langue cible."""
    data        = request.json or {}
    target_lang = data.get("target_language", "en")
    level       = data.get("level", "debutant")
    topic       = data.get("topic", "général")

    lang_name  = LANG_EN.get(target_lang, target_lang)
    level_desc = {"debutant": "beginner", "intermediaire": "intermediate", "avance": "advanced"}.get(level, level)

    result = ai([
        {
            "role": "system",
            "content": (
                f"You are a language exercise generator for {lang_name} learners at {level_desc} level. "
                f"Generate a multiple-choice exercise about the topic: {topic}. "
                f"Return ONLY valid JSON, no extra text, in this exact format: "
                f'{{"question":"(question written in {lang_name})","options":["opt1","opt2","opt3","opt4"],"correct":0,"explanation":"(explanation in French first, then the same explanation in {lang_name}. Separate the two with a line break like: French explanation\\n\\n{lang_name} explanation)"}} '
                f"where 'correct' is the index (0-3) of the right answer. "
                f"The question and options must be in {lang_name}. "
                f"IMPORTANT: The explanation must have TWO parts: first in French, then in {lang_name}. "
                f"Vary the position of the correct answer."
            ),
        },
        {"role": "user", "content": "Generate one exercise."},
    ], max_tokens=400, temperature=0.9)

    if result:
        import json as _json
        try:
            return jsonify(_json.loads(result))
        except Exception:
            pass

    # Fallback exercises per language
    fallbacks = {
        "en": {"question": "Comment dit-on 'Bonjour' en anglais ?",    "options": ["Hello", "Goodbye", "Please", "Sorry"],     "correct": 0, "explanation": "'Hello' signifie 'Bonjour'. C'est le premier mot à apprendre !"},
        "es": {"question": "Comment dit-on 'Merci' en espagnol ?",      "options": ["Hola", "Gracias", "Por favor", "Adiós"],    "correct": 1, "explanation": "'Gracias' signifie 'Merci' en espagnol."},
        "de": {"question": "Comment dit-on 'S'il vous plaît' en allemand ?", "options": ["Danke", "Hallo", "Bitte", "Tschüss"], "correct": 2, "explanation": "'Bitte' signifie 'S'il vous plaît' en allemand."},
        "ar": {"question": "Comment dit-on 'Bienvenue' en arabe ?",     "options": ["شكراً", "أهلاً وسهلاً", "مع السلامة", "صباح الخير"], "correct": 1, "explanation": "'أهلاً وسهلاً' signifie 'Bienvenue' en arabe."},
    }
    return jsonify(fallbacks.get(target_lang, fallbacks["en"]))


@app.route("/dictation-text", methods=["POST"])
def dictation_text():
    """Generate a short text for dictation exercise."""
    data        = request.json or {}
    target_lang = data.get("target_language", "en")
    level       = data.get("level", "debutant")

    lang_name  = LANG_EN.get(target_lang, target_lang)
    level_desc = {"debutant": "beginner (A1-A2, 1-2 simple sentences)", "intermediaire": "intermediate (B1, 2-3 sentences)", "avance": "advanced (B2-C1, 3-4 varied sentences)"}.get(level, "beginner")

    result = ai([
        {
            "role": "system",
            "content": (
                f"You are a language exercise generator. "
                f"Generate a short dictation text in {lang_name} for a {level_desc} learner. "
                f"Return ONLY the text to dictate — no instructions, no translation, just the {lang_name} text."
            ),
        },
        {"role": "user", "content": "Generate one dictation text."},
    ], max_tokens=150, temperature=0.8)

    fallbacks = {
        "en": "Hello, my name is John. I like to learn new languages every day.",
        "es": "Hola, me llamo María. Me gusta aprender idiomas nuevos.",
        "de": "Hallo, ich heiße Thomas. Ich lerne gerne neue Sprachen.",
        "fr": "Bonjour, je m'appelle Sophie. J'aime apprendre de nouvelles langues.",
        "it": "Ciao, mi chiamo Marco. Mi piace imparare nuove lingue.",
    }

    return jsonify({"text": result or fallbacks.get(target_lang, fallbacks["en"])})


@app.route("/pronunciation", methods=["POST"])
def pronunciation():
    """Compare transcribed text with expected text, return score 0-100."""
    data     = request.json or {}
    expected = data.get("expected", "").strip().lower()
    actual   = data.get("actual", "").strip().lower()

    if not expected or not actual:
        return jsonify({"score": 0, "feedback": "Texte manquant."})

    # Token-level comparison
    import re
    def tokenize(s):
        return re.findall(r'\w+', s.lower())

    exp_tokens = tokenize(expected)
    act_tokens = tokenize(actual)

    if not exp_tokens:
        return jsonify({"score": 0, "feedback": "Texte de référence vide."})

    matches = sum(1 for w in act_tokens if w in exp_tokens)
    score   = min(100, round((matches / len(exp_tokens)) * 100))

    if USE_AI:
        feedback_result = ai([
            {
                "role": "system",
                "content": (
                    "You are a pronunciation coach. Compare the expected text with the actual transcription "
                    "and give brief feedback in French (1-2 sentences). "
                    f"Expected: '{expected}'. Actual: '{actual}'. Score: {score}/100. "
                    "Be encouraging and specific about what to improve."
                ),
            },
            {"role": "user", "content": "Give feedback."},
        ], max_tokens=100, temperature=0.7)
    else:
        feedback_result = None

    if not feedback_result:
        if score >= 80:
            feedback_result = f"Excellent ! Score de {score}/100. Votre prononciation est très bonne !"
        elif score >= 50:
            feedback_result = f"Bien ! Score de {score}/100. Continuez à pratiquer pour améliorer votre prononciation."
        else:
            feedback_result = f"Score de {score}/100. Réécoutez le texte original et réessayez."

    return jsonify({"score": score, "feedback": feedback_result})


# ── Legacy routes (kept for compatibility) ─────────────────────────────────────

@app.route("/lesson", methods=["GET"])
def get_lesson():
    return jsonify({"lesson": "basics_1", "question": "Translate: Hello", "answer": "bonjour"})


@app.route("/check", methods=["POST"])
def check_answer():
    data    = request.json or {}
    user_a  = data.get("answer", "").lower().strip()
    correct = data.get("correct", "").lower().strip()
    ok      = user_a == correct
    return jsonify({"correct": ok, "explanation": "✅ Correct !" if ok else "❌ Incorrect, réessayez."})


@app.route("/progress", methods=["GET"])
def progress():
    return jsonify({"score": 0, "streak": 0, "mistakes": []})


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 AI Service on port {port} — AI: {'enabled' if USE_AI else 'disabled (fallback mode)'}")
    app.run(host="0.0.0.0", port=port, debug=False)
