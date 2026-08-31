from flask import Flask, request, jsonify, send_file, after_this_request
from flask_cors import CORS
import os
import re
import tempfile
import uuid
import subprocess
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── Config ─────────────────────────────────────────────────────────────────────
# Tout tourne en local, sur CPU, sans clé API ni coût :
#   - Traduction            : NLLB-200-distilled-600M (Meta)
#   - Explications/chat/QCM : Qwen2.5-1.5B-Instruct (suit les consignes de format/langue
#                              plus fiablement que Mistral-7B-Instruct-v0.2 quantisé, testé)
#   - Transcription vocale  : Vosk (un petit modèle par langue, téléchargé à la demande)
#   - Lecture (TTS)         : Coqui TTS (un modèle par langue)

NLLB_MODEL      = os.getenv("NLLB_MODEL", "facebook/nllb-200-distilled-600M")
LOCAL_LLM_MODEL = os.getenv("LOCAL_LLM_MODEL", "Qwen/Qwen2.5-3B-Instruct")
VOSK_CACHE_DIR  = os.getenv("VOSK_CACHE_DIR", "/root/.cache/vosk")
VOSK_BASE_URL   = "https://alphacephei.com/vosk/models/"

# ── Language maps ───────────────────────────────────────────────────────────────

LANG_EN = {
    "fr": "French", "en": "English", "es": "Spanish", "de": "German",
    "ar": "Arabic", "it": "Italian", "pt": "Portuguese", "zh": "Chinese", "ja": "Japanese",
}

LANG_FR = {
    "fr": "français", "en": "anglais", "es": "espagnol", "de": "allemand",
    "ar": "arabe",    "it": "italien", "pt": "portugais", "zh": "chinois",  "ja": "japonais",
}

# Codes FLORES-200 attendus par NLLB
NLLB_LANG = {
    "fr": "fra_Latn", "en": "eng_Latn", "es": "spa_Latn", "de": "deu_Latn",
    "ar": "arb_Arab", "it": "ita_Latn", "pt": "por_Latn", "zh": "zho_Hans", "ja": "jpn_Jpan",
}

# Modèles Vosk (petits, offline) par langue — téléchargés à la demande
VOSK_MODELS = {
    "fr": "vosk-model-small-fr-0.22",
    "en": "vosk-model-small-en-us-0.15",
    "es": "vosk-model-small-es-0.42",
    "de": "vosk-model-small-de-0.15",
    "it": "vosk-model-small-it-0.22",
    "pt": "vosk-model-small-pt-0.3",
    "zh": "vosk-model-small-cn-0.22",
    "ja": "vosk-model-small-ja-0.22",
    "ar": "vosk-model-ar-mgb2-0.4",
}

# Modèles Coqui TTS par langue (VITS, une voix par langue)
COQUI_TTS_MODELS = {
    "en": "tts_models/en/ljspeech/tacotron2-DDC",
    "fr": "tts_models/fr/css10/vits",
    "de": "tts_models/de/thorsten/vits",
    "es": "tts_models/es/css10/vits",
    "it": "tts_models/it/mai_female/vits",
    "pt": "tts_models/pt/cv/vits",
}

# ── NLLB (traduction) ───────────────────────────────────────────────────────────

_nllb_model = None
_nllb_tokenizer = None


def get_nllb():
    global _nllb_model, _nllb_tokenizer
    if _nllb_model is None:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        print(f"⏳ Chargement de {NLLB_MODEL} (traduction)...")
        _nllb_tokenizer = AutoTokenizer.from_pretrained(NLLB_MODEL)
        _nllb_model = AutoModelForSeq2SeqLM.from_pretrained(NLLB_MODEL, low_cpu_mem_usage=False)
        print("✅ NLLB-200 chargé")
    return _nllb_model, _nllb_tokenizer


def nllb_translate(text, source_lang, target_lang):
    if source_lang == target_lang:
        return text
    src = NLLB_LANG.get(source_lang, "fra_Latn")
    tgt = NLLB_LANG.get(target_lang, "eng_Latn")
    model, tok = get_nllb()
    tok.src_lang = src
    inputs = tok(text, return_tensors="pt")
    tgt_id = tok.convert_tokens_to_ids(tgt)
    out = model.generate(**inputs, forced_bos_token_id=tgt_id, max_new_tokens=200)
    return tok.batch_decode(out, skip_special_tokens=True)[0]


# Questions du type "comment dire/dit-on X en {langue}" : un petit LLM de
# chat hallucine facilement sur ce genre de lookup de vocabulaire précis
# (ex: "une fourchette se dit une fourchette en anglais"). On détecte ce
# pattern et on traduit directement le mot/l'expression via NLLB, fiable.
_VOCAB_QUESTION_VERBS = r"dire|dit-on|dis-tu|dis tu|on dit|on prononce|prononcer|tu prononces|épeler|traduire|traduis"
_TRANSLATION_QUESTION_PATTERNS = [
    re.compile(rf"(?:comment|que)\s+(?:{_VOCAB_QUESTION_VERBS})(?:-moi|\s+moi)?\s+en\s+\w+\s+(.+?)[\?\.\!]*$", re.IGNORECASE),
    re.compile(rf"(?:comment|que)\s+(?:{_VOCAB_QUESTION_VERBS})(?:-moi|\s+moi)?\s+(.+?)\s+en\s+\w+[\?\.\!]*$", re.IGNORECASE),
    re.compile(rf"(.+?)\s+en\s+\w+\s+ça\s+se\s+(?:dit|prononce)\s+comment[\?\.\!]*$", re.IGNORECASE),
]


def _extract_translation_question_word(text):
    """Extrait le mot/l'expression demandé si le texte matche un pattern
    "comment dit-on X en {langue}", sinon None. Utilisé pour savoir QUOI
    traduire une fois que le classifieur (voir plus bas) a décidé QUE
    c'est bien ce type de question."""
    for pattern in _TRANSLATION_QUESTION_PATTERNS:
        match = pattern.search(text)
        if match:
            word = match.group(1).strip(" '\"?.!")
            if word:
                return word
    return None


# ── 3.2 : classifieur d'intention "question de vocabulaire" ────────────────────
# Petit réseau entraîné from scratch (voir train_intent_model.py), 5 569
# paramètres, qui décide si un message est une question de vocabulaire
# ("comment dit-on X en Y ?") plutôt que de compter uniquement sur le regex
# ci-dessus, qui ne couvre que les formulations prévues à l'avance.

_intent_model = None
_intent_vocab = None
INTENT_MODEL_DIR = os.getenv("INTENT_MODEL_DIR", os.path.join(os.path.dirname(__file__), "models"))


def _intent_tokenize(text):
    return re.findall(r"[a-zàâäéèêëïîôöùûüç']+", text.lower())


def _intent_encode(text, vocab, max_len=16):
    ids = [vocab.get(tok, vocab.get("<unk>", 1)) for tok in _intent_tokenize(text)][:max_len]
    ids += [vocab.get("<pad>", 0)] * (max_len - len(ids))
    return ids


def get_intent_model():
    global _intent_model, _intent_vocab
    if _intent_model is None:
        import json as _json
        import torch
        import torch.nn as nn

        class IntentClassifier(nn.Module):
            def __init__(self, vocab_size, embed_dim=32, hidden_dim=32):
                super().__init__()
                self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
                self.fc1 = nn.Linear(embed_dim, hidden_dim)
                self.fc2 = nn.Linear(hidden_dim, 1)
                self.relu = nn.ReLU()

            def forward(self, x):
                mask = (x != 0).unsqueeze(-1).float()
                emb = self.embedding(x) * mask
                pooled = emb.sum(dim=1) / mask.sum(dim=1).clamp(min=1)
                h = self.relu(self.fc1(pooled))
                return self.fc2(h).squeeze(-1)

        with open(os.path.join(INTENT_MODEL_DIR, "intent_vocab.json"), encoding="utf-8") as f:
            _intent_vocab = _json.load(f)
        model = IntentClassifier(vocab_size=len(_intent_vocab))
        model.load_state_dict(torch.load(os.path.join(INTENT_MODEL_DIR, "intent_classifier.pt"), map_location="cpu"))
        model.eval()
        _intent_model = model
        print("✅ Classifieur d'intention (modèle maison, 5 569 paramètres) chargé")
    return _intent_model, _intent_vocab


def is_vocabulary_question(text):
    """True si le petit modèle entraîné détecte une question de vocabulaire."""
    try:
        import torch
        model, vocab = get_intent_model()
        ids = torch.tensor([_intent_encode(text, vocab)], dtype=torch.long)
        with torch.no_grad():
            prob = torch.sigmoid(model(ids)).item()
        return prob > 0.5
    except Exception as e:
        print(f"Intent classifier error: {e}")
        return False

# ── Qwen2.5-1.5B-Instruct (explications / chat / exercices) ────────────────────

_llm_pipeline = None


def get_llm():
    global _llm_pipeline
    if _llm_pipeline is None:
        from transformers import pipeline
        print(f"⏳ Chargement de {LOCAL_LLM_MODEL} (premier appel, peut prendre plusieurs minutes)...")
        _llm_pipeline = pipeline(
            "text-generation", model=LOCAL_LLM_MODEL, device=-1,
            model_kwargs={"low_cpu_mem_usage": False},
        )
        print("✅ Modèle local chargé")
    return _llm_pipeline


def local_ai(messages, max_tokens=300, temperature=0.7):
    """Génère du texte avec le LLM local, ou None en cas d'échec."""
    try:
        pipe = get_llm()
        out = pipe(
            messages,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            pad_token_id=pipe.tokenizer.eos_token_id,
        )
        return out[0]["generated_text"][-1]["content"].strip()
    except Exception as e:
        print(f"Local LLM error: {e}")
        return None

# ── Vosk (transcription) ────────────────────────────────────────────────────────

_vosk_models = {}


def _download_vosk_model(model_name):
    import zipfile
    import requests as _requests
    os.makedirs(VOSK_CACHE_DIR, exist_ok=True)
    zip_path = os.path.join(VOSK_CACHE_DIR, model_name + ".zip")
    print(f"⏳ Téléchargement du modèle Vosk {model_name}...")
    r = _requests.get(VOSK_BASE_URL + model_name + ".zip", stream=True, timeout=300)
    r.raise_for_status()
    with open(zip_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=1 << 20):
            f.write(chunk)
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(VOSK_CACHE_DIR)
    os.remove(zip_path)
    print(f"✅ Modèle Vosk {model_name} prêt")


def get_vosk(lang):
    if lang not in _vosk_models:
        from vosk import Model
        model_name = VOSK_MODELS.get(lang, VOSK_MODELS["en"])
        model_dir = os.path.join(VOSK_CACHE_DIR, model_name)
        if not os.path.isdir(model_dir):
            _download_vosk_model(model_name)
        _vosk_models[lang] = Model(model_dir)
    return _vosk_models[lang]


def _to_wav_pcm16(input_path):
    """Convertit n'importe quel format audio (webm, mp3...) en WAV mono 16kHz PCM16 via ffmpeg."""
    output_path = input_path + "_conv.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-i", input_path, "-ar", "16000", "-ac", "1", "-sample_fmt", "s16", output_path],
        check=True, capture_output=True,
    )
    return output_path


def vosk_transcribe(audio_path, lang):
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
        model = get_vosk(lang)
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

# ── Coqui TTS (lecture) ──────────────────────────────────────────────────────────

_tts_models = {}


def get_tts(lang):
    if lang not in _tts_models:
        from TTS.api import TTS
        model_name = COQUI_TTS_MODELS.get(lang)
        if not model_name:
            return None
        print(f"⏳ Chargement de Coqui TTS ({model_name})...")
        _tts_models[lang] = TTS(model_name, progress_bar=False, gpu=False)
        print("✅ Coqui TTS chargé")
    return _tts_models[lang]

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "ai": True})


@app.route("/translate", methods=["POST"])
def translate():
    """3.3.2 — Traduction via NLLB-200 (local, gratuit)."""
    data        = request.json or {}
    text        = data.get("text", "").strip()
    source_lang = data.get("source_lang", "fr")
    target_lang = data.get("target_lang", "en")

    if not text:
        return jsonify({"translation": ""})

    tgt_name = LANG_EN.get(target_lang, target_lang)
    result = None
    try:
        result = nllb_translate(text, source_lang, target_lang)
    except Exception as e:
        print(f"Translation error: {e}")

    if not result:
        result = f"[{tgt_name}] {text}"

    return jsonify({"translation": result})


@app.route("/explain", methods=["POST"])
def explain():
    """3.3.4 — Explications via Mistral-7B-Instruct (local, gratuit)."""
    data     = request.json or {}
    text     = data.get("text", "").strip()
    language = data.get("language", "en")
    level    = data.get("level", "debutant")

    if not text:
        return jsonify({"explanation": ""})

    lang_name  = LANG_EN.get(language, language)
    level_desc = {"debutant": "beginner", "intermediaire": "intermediate", "avance": "advanced"}.get(level, level)

    result = local_ai([
        {
            "role": "system",
            "content": (
                f"You are a friendly language coach who helps French speakers learn {lang_name}. "
                f"The learner is at {level_desc} level. "
                f"Analyze the following {lang_name} text and provide a concise explanation covering: "
                f"key vocabulary, grammar points, and any cultural context. "
                f"CRITICAL RULE: write your explanation entirely in FRENCH, regardless of what language the text is in. "
                f"Keep it encouraging and easy to understand. Maximum 3 sentences, written in French."
            ),
        },
        {"role": "user", "content": text},
    ], max_tokens=250)

    if not result:
        tgt_fr = LANG_FR.get(language, language)
        result = f"Texte en {tgt_fr} analysé. Relis-le attentivement et compare-le à la traduction pour repérer le vocabulaire et la grammaire clés."

    return jsonify({"explanation": result})


@app.route("/respond", methods=["POST"])
def respond():
    """Conversation avec le coach IA : Qwen2.5 génère la réponse en français
    (langue où il est le plus fiable), puis NLLB la traduit vers la langue
    cible pour garantir que le texte est vraiment dans la bonne langue."""
    data        = request.json or {}
    user_msg    = data.get("user_message", "").strip()
    history     = data.get("conversation_history", [])
    target_lang = data.get("target_language", "en")
    level       = data.get("level", "debutant")

    if not user_msg:
        return jsonify({"response": "Bonjour ! Comment puis-je vous aider ?"})

    # "Comment dit-on X en {langue} ?" — un lookup de vocabulaire précis,
    # plus fiable via NLLB (traduction) que via le LLM de chat (qui hallucine).
    # Le petit modèle entraîné (3.2) décide QUE c'est ce type de question ;
    # le regex extrait QUOI traduire (avec repli sur le message entier).
    if is_vocabulary_question(user_msg):
        asked_word = _extract_translation_question_word(user_msg) or user_msg
        try:
            translated_word = nllb_translate(asked_word, "fr", target_lang)
            if translated_word:
                return jsonify({"response": translated_word})
        except Exception as e:
            print(f"Translation-question error: {e}")

    level_desc = {"debutant": "débutant", "intermediaire": "intermédiaire", "avance": "avancé"}.get(level, "débutant")

    messages = [
        {
            "role": "system",
            "content": (
                f"Tu es Lingua Coach, un assistant chaleureux qui aide à apprendre une langue. "
                f"L'utilisateur est de niveau {level_desc}. "
                f"Réponds TOUJOURS en français, en 1 à 2 phrases courtes maximum. "
                f"Sois encourageant. Si l'utilisateur fait une erreur, corrige-la gentiment dans ta réponse."
            ),
        }
    ]

    for h in history[-6:]:
        if isinstance(h, dict) and h.get("role") in ("user", "assistant") and h.get("content"):
            messages.append({"role": h["role"], "content": h["content"]})

    messages.append({"role": "user", "content": user_msg})

    reply_fr = local_ai(messages, max_tokens=80, temperature=0.7)

    if not reply_fr:
        reply_fr = "Merci pour ton message ! Continue à t'entraîner, tu progresses bien."

    result = reply_fr
    if target_lang != "fr":
        try:
            translated = nllb_translate(reply_fr, "fr", target_lang)
            if translated:
                result = translated
        except Exception as e:
            print(f"Respond translation error: {e}")

    return jsonify({"response": result})


@app.route("/transcribe", methods=["POST"])
def transcribe():
    """3.3.1 — Retranscription via Vosk (local, gratuit, hors-ligne)."""
    audio_file = request.files.get("audio")
    language   = request.form.get("language", "en")
    if not audio_file:
        return jsonify({"text": "", "error": "no audio"})

    suffix = os.path.splitext(audio_file.filename or "")[1] or ".webm"
    tmp_path = os.path.join(tempfile.gettempdir(), f"lingua_{uuid.uuid4().hex}{suffix}")
    try:
        audio_file.save(tmp_path)
        size = os.path.getsize(tmp_path)
        print(f"[transcribe] received {size} bytes, filename={audio_file.filename}, content_type={audio_file.content_type}, language={language}")
        text = vosk_transcribe(tmp_path, language)
        print(f"[transcribe] result text={text!r}")
        return jsonify({"text": text})
    except Exception as e:
        print(f"Vosk error: {e}")
        return jsonify({"text": "", "error": str(e)})
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.route("/tts", methods=["POST"])
def tts():
    """3.3.3 — Lecture de la traduction via Coqui TTS (local, gratuit)."""
    data     = request.json or {}
    text     = data.get("text", "").strip()
    language = data.get("language", "en")
    if not text:
        return jsonify({"error": "no text"}), 400

    engine = get_tts(language)
    if not engine:
        return jsonify({"error": f"no TTS model for language {language}"}), 503

    out_path = os.path.join(tempfile.gettempdir(), f"tts_{uuid.uuid4().hex}.wav")
    try:
        engine.tts_to_file(text=text, file_path=out_path)

        @after_this_request
        def _cleanup(response):
            if os.path.exists(out_path):
                os.remove(out_path)
            return response

        return send_file(out_path, mimetype="audio/wav")
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


_EXERCISE_PLACEHOLDER_TOKENS = {
    "...", "..", ".", "option", "opt1", "opt2", "opt3", "opt4",
    "explanation", "correct", "question", "answer", "n/a", "none",
}


def _is_valid_exercise(parsed):
    """Rejette les générations où le petit LLM local a recopié les
    placeholders du prompt (ex: "..." ou "explanation") au lieu de
    produire de vrais mots — un mode d'échec observé en pratique."""
    options = parsed.get("options")
    correct = parsed.get("correct")
    question = str(parsed.get("question", "")).strip()
    explanation = str(parsed.get("explanation", "")).strip()

    if not isinstance(options, list) or len(options) != 4:
        return False
    if not isinstance(correct, int) or not (0 <= correct < 4):
        return False
    if len(question) < 3 or len(explanation) < 3:
        return False

    cleaned = [str(o).strip().strip("<>").lower() for o in options]
    if any(not c or c in _EXERCISE_PLACEHOLDER_TOKENS for c in cleaned):
        return False
    if len(set(cleaned)) != len(cleaned):
        return False

    return True


@app.route("/exercise", methods=["POST"])
def exercise():
    """Génère un exercice QCM dans la langue cible via Mistral-7B-Instruct (local, gratuit)."""
    data        = request.json or {}
    target_lang = data.get("target_language", "en")
    level       = data.get("level", "debutant")
    topic       = data.get("topic", "général")

    lang_name  = LANG_EN.get(target_lang, target_lang)
    level_desc = {"debutant": "beginner", "intermediaire": "intermediate", "avance": "advanced"}.get(level, level)

    result = local_ai([
        {
            "role": "system",
            "content": (
                f"You are a JSON API for a {lang_name} vocabulary quiz generator (learner level: {level_desc}). "
                f"You output ONLY a single JSON object, nothing else — no explanations, no markdown, no code fences. "
                f"The quiz question is about the topic: {topic}. "
                f"Required JSON shape (fill in the values, keep the exact keys):\n"
                f'{{"question": "<a vocabulary question written in {lang_name}>", '
                f'"options": ["<opt1>", "<opt2>", "<opt3>", "<opt4>"], '
                f'"correct": <integer index 0-3 of the right option>, '
                f'"explanation": "<short explanation in French, then two newlines, then the same explanation in {lang_name}>"}}\n'
                f"Example shape (do not reuse this content, just the structure): "
                f'{{"question": "Comment dit-on chat ?", "options": ["chien", "chat_word", "oiseau", "poisson"], "correct": 1, "explanation": "Ceci est un exemple.\\n\\nThis is an example."}}\n'
                f"Now output ONLY the JSON object for the real quiz question, in {lang_name}, about {topic}."
            ),
        },
        {"role": "user", "content": "Generate the JSON now."},
    ], max_tokens=350, temperature=0.8)

    if result:
        import json as _json, re as _re
        match = _re.search(r"\{.*\}", result, _re.DOTALL)
        if match:
            json_str = _re.sub(r",(\s*[}\]])", r"\1", match.group(0))  # virgules finales
            try:
                parsed = _json.loads(json_str)
                if all(k in parsed for k in ("question", "options", "correct", "explanation")) and _is_valid_exercise(parsed):
                    return jsonify(parsed)
            except Exception:
                pass

    fallbacks = {
        "en": {"question": "Comment dit-on 'Bonjour' en anglais ?",    "options": ["Hello", "Goodbye", "Please", "Sorry"],     "correct": 0, "explanation": "'Hello' signifie 'Bonjour'. C'est le premier mot à apprendre !"},
        "es": {"question": "Comment dit-on 'Merci' en espagnol ?",      "options": ["Hola", "Gracias", "Por favor", "Adiós"],    "correct": 1, "explanation": "'Gracias' signifie 'Merci' en espagnol."},
        "de": {"question": "Comment dit-on 'S'il vous plaît' en allemand ?", "options": ["Danke", "Hallo", "Bitte", "Tschüss"], "correct": 2, "explanation": "'Bitte' signifie 'S'il vous plaît' en allemand."},
        "ar": {"question": "Comment dit-on 'Bienvenue' en arabe ?",     "options": ["شكراً", "أهلاً وسهلاً", "مع السلامة", "صباح الخير"], "correct": 1, "explanation": "'أهلاً وسهلاً' signifie 'Bienvenue' en arabe."},
        "it": {"question": "Comment dit-on 'Merci' en italien ?",       "options": ["Grazie", "Ciao", "Prego", "Scusa"],        "correct": 0, "explanation": "'Grazie' signifie 'Merci' en italien."},
        "pt": {"question": "Comment dit-on 'Bonjour' en portugais ?",   "options": ["Obrigado", "Bom dia", "Tchau", "Desculpa"], "correct": 1, "explanation": "'Bom dia' signifie 'Bonjour' en portugais."},
        "zh": {"question": "Comment dit-on 'Merci' en chinois ?",       "options": ["你好", "谢谢", "再见", "对不起"],           "correct": 1, "explanation": "'谢谢' (xièxie) signifie 'Merci' en chinois."},
        "ja": {"question": "Comment dit-on 'Bonjour' en japonais ?",    "options": ["ありがとう", "こんにちは", "さようなら", "すみません"], "correct": 1, "explanation": "'こんにちは' (konnichiwa) signifie 'Bonjour' en japonais."},
    }
    return jsonify(fallbacks.get(target_lang, fallbacks["en"]))


@app.route("/dictation-text", methods=["POST"])
def dictation_text():
    """Texte de dictée via Mistral-7B-Instruct (local, gratuit)."""
    data        = request.json or {}
    target_lang = data.get("target_language", "en")
    level       = data.get("level", "debutant")

    lang_name  = LANG_EN.get(target_lang, target_lang)
    level_desc = {"debutant": "beginner (A1-A2, 1-2 simple sentences)", "intermediaire": "intermediate (B1, 2-3 sentences)", "avance": "advanced (B2-C1, 3-4 varied sentences)"}.get(level, "beginner")

    result = local_ai([
        {
            "role": "system",
            "content": (
                f"You are a text generator for a language-learning dictation activity. "
                f"Write a short passage in {lang_name} for a {level_desc} learner to transcribe by ear. "
                f"Output ONLY the {lang_name} passage itself — no instructions, no translation, no quotes, no extra text."
            ),
        },
        {"role": "user", "content": "Generate one dictation text."},
    ], max_tokens=100, temperature=0.8)

    if result:
        return jsonify({"text": result})

    fallbacks = {
        "en": "Hello, my name is John. I like to learn new languages every day.",
        "es": "Hola, me llamo María. Me gusta aprender idiomas nuevos.",
        "de": "Hallo, ich heiße Thomas. Ich lerne gerne neue Sprachen.",
        "fr": "Bonjour, je m'appelle Sophie. J'aime apprendre de nouvelles langues.",
        "it": "Ciao, mi chiamo Marco. Mi piace imparare nuove lingue.",
        "pt": "Olá, meu nome é Ana. Gosto de aprender novos idiomas.",
        "zh": "你好，我叫小明。我每天都喜欢学习新的语言。",
        "ar": "مرحباً، اسمي أحمد. أحب تعلم لغات جديدة كل يوم.",
        "ja": "こんにちは、私の名前はゆきです。毎日新しい言語を学ぶのが好きです。",
    }

    return jsonify({"text": fallbacks.get(target_lang, fallbacks["en"])})


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

    feedback_result = local_ai([
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
    ], max_tokens=80, temperature=0.7)

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
    print(f"🚀 AI Service on port {port} — modèles 100% locaux (NLLB-200, Qwen2.5-1.5B, Vosk, Coqui TTS)")
    app.run(host="0.0.0.0", port=port, debug=False)
