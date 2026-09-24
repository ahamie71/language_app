"""/exercise + /dictation-text — generation d'activites via le LLM local."""

import json
import random
import re

from language import LANG_EN, LANG_FR
from services import llm, translation

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


def _clean(value):
    return str(value or "").strip().strip("<>\"'«» ").strip()


def _parse_item(result):
    """Extrait {french, answer, distractors, explanation} du texte du LLM,
    ou None si la generation est inexploitable (placeholders recopies, doublons...)."""
    if not result:
        return None
    match = re.search(r"\{.*\}", result, re.DOTALL)
    if not match:
        return None
    try:
        parsed = json.loads(re.sub(r",(\s*[}\]])", r"\1", match.group(0)))  # virgules finales
    except Exception:
        return None

    french = _clean(parsed.get("french"))
    answer = _clean(parsed.get("answer"))
    distractors = parsed.get("distractors")
    explanation = str(parsed.get("explanation") or "").strip()
    if not isinstance(distractors, list):
        return None
    distractors = [_clean(d) for d in distractors][:3]

    options = [answer] + distractors
    lowered = [o.lower() for o in options]
    if len(options) != 4 or len(french) < 2 or len(explanation) < 3:
        return None
    if any(not o or o in _EXERCISE_PLACEHOLDER_TOKENS for o in lowered):
        return None
    if len(set(lowered)) != 4 or french.lower() in lowered:
        return None
    return {"french": french, "answer": answer, "distractors": distractors, "explanation": explanation}


def _answer_is_ambiguous(item, target_lang):
    """Verification croisee avec NLLB : si la traduction de l'expression
    francaise tombe sur un distracteur, le QCM aurait deux bonnes reponses."""
    try:
        reference = (translation.translate(item["french"], "fr", target_lang) or "").strip(" .!?").lower()
    except Exception:
        return False
    return bool(reference) and any(reference == d.lower() for d in item["distractors"])


def exercise(target_lang, level, topic):
    lang_name    = LANG_EN.get(target_lang, target_lang)
    lang_name_fr = LANG_FR.get(target_lang, target_lang)
    level_desc   = _LEVELS_EN.get(level, level)

    # Le LLM ne fournit que le contenu ; la question, l'ordre des options et
    # l'index de la bonne reponse sont construits ici (le modele se trompait
    # d'index et ecrivait la question dans la langue cible, reponses comprises).
    messages = [
        {
            "role": "system",
            "content": (
                f"You are a JSON API for a vocabulary quiz for French speakers learning {lang_name} "
                f"(learner level: {level_desc}), topic: {topic}. "
                f"You output ONLY a single JSON object — no markdown, no code fences. Keys:\n"
                f'"french": a common French word or short expression about the topic;\n'
                f'"answer": its correct {lang_name} translation;\n'
                f'"distractors": 3 other {lang_name} words or expressions from the same topic that are clearly WRONG translations of "french", '
                f'written in the same form as "answer" (all with an article or all without);\n'
                f'"explanation": one or two short sentences in French only, explaining the {lang_name} answer.\n'
                f'Example (do not reuse): {{"french": "le chat", "answer": "the cat", '
                f'"distractors": ["the dog", "the bird", "the fish"], '
                f'"explanation": "« The cat » veut dire « le chat » ; « cat » est le mot anglais pour cet animal."}}'
            ),
        },
        {"role": "user", "content": "Generate the JSON now."},
    ]

    for _ in range(2):
        item = _parse_item(llm.generate(messages, max_tokens=250, temperature=0.8))
        if not item or _answer_is_ambiguous(item, target_lang):
            continue
        options = [item["answer"]] + item["distractors"]
        random.shuffle(options)
        return {
            "question": f"Comment dit-on « {item['french']} » en {lang_name_fr} ?",
            "options": options,
            "correct": options.index(item["answer"]),
            "explanation": item["explanation"],
        }

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
