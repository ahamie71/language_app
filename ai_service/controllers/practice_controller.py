"""/exercise + /dictation-text — generation d'activites via le LLM local."""

import json
import re

from language import LANG_EN
from services import llm

_LEVELS_EN = {"debutant": "beginner", "intermediaire": "intermediate", "avance": "advanced"}
_DICTATION_LEVELS = {
    "debutant": "beginner (A1-A2, 1-2 simple sentences)",
    "intermediaire": "intermediate (B1, 2-3 sentences)",
    "avance": "advanced (B2-C1, 3-4 varied sentences)",
}

_EXERCISE_PLACEHOLDER_TOKENS = {
    "...", "..", ".", "option", "opt1", "opt2", "opt3", "opt4",
    "explanation", "correct", "question", "answer", "n/a", "none",
}

_EXERCISE_FALLBACKS = {
    "en": {"question": "Comment dit-on 'Bonjour' en anglais ?",    "options": ["Hello", "Goodbye", "Please", "Sorry"],     "correct": 0, "explanation": "'Hello' signifie 'Bonjour'. C'est le premier mot à apprendre !"},
    "es": {"question": "Comment dit-on 'Merci' en espagnol ?",      "options": ["Hola", "Gracias", "Por favor", "Adiós"],    "correct": 1, "explanation": "'Gracias' signifie 'Merci' en espagnol."},
    "de": {"question": "Comment dit-on 'S'il vous plaît' en allemand ?", "options": ["Danke", "Hallo", "Bitte", "Tschüss"], "correct": 2, "explanation": "'Bitte' signifie 'S'il vous plaît' en allemand."},
    "ar": {"question": "Comment dit-on 'Bienvenue' en arabe ?",     "options": ["شكراً", "أهلاً وسهلاً", "مع السلامة", "صباح الخير"], "correct": 1, "explanation": "'أهلاً وسهلاً' signifie 'Bienvenue' en arabe."},
    "it": {"question": "Comment dit-on 'Merci' en italien ?",       "options": ["Grazie", "Ciao", "Prego", "Scusa"],        "correct": 0, "explanation": "'Grazie' signifie 'Merci' en italien."},
    "pt": {"question": "Comment dit-on 'Bonjour' en portugais ?",   "options": ["Obrigado", "Bom dia", "Tchau", "Desculpa"], "correct": 1, "explanation": "'Bom dia' signifie 'Bonjour' en portugais."},
    "zh": {"question": "Comment dit-on 'Merci' en chinois ?",       "options": ["你好", "谢谢", "再见", "对不起"],           "correct": 1, "explanation": "'谢谢' (xièxie) signifie 'Merci' en chinois."},
    "ja": {"question": "Comment dit-on 'Bonjour' en japonais ?",    "options": ["ありがとう", "こんにちは", "さようなら", "すみません"], "correct": 1, "explanation": "'こんにちは' (konnichiwa) signifie 'Bonjour' en japonais."},
}

_DICTATION_FALLBACKS = {
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


def _is_valid_exercise(parsed):
    """Rejette les generations ou le LLM a recopie les placeholders du prompt
    (ex : "..." ou "explanation") au lieu de produire de vrais mots."""
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


def exercise(target_lang, level, topic):
    lang_name  = LANG_EN.get(target_lang, target_lang)
    level_desc = _LEVELS_EN.get(level, level)

    result = llm.generate([
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
        match = re.search(r"\{.*\}", result, re.DOTALL)
        if match:
            json_str = re.sub(r",(\s*[}\]])", r"\1", match.group(0))  # virgules finales
            try:
                parsed = json.loads(json_str)
                if all(k in parsed for k in ("question", "options", "correct", "explanation")) and _is_valid_exercise(parsed):
                    return parsed
            except Exception:
                pass

    return _EXERCISE_FALLBACKS.get(target_lang, _EXERCISE_FALLBACKS["en"])


def dictation_text(target_lang, level):
    lang_name  = LANG_EN.get(target_lang, target_lang)
    level_desc = _DICTATION_LEVELS.get(level, "beginner")

    result = llm.generate([
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
        return {"text": result}

    return {"text": _DICTATION_FALLBACKS.get(target_lang, _DICTATION_FALLBACKS["en"])}
