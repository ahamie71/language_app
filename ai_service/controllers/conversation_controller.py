"""/respond — conversation avec le coach IA.

Le LLM genere la reponse en francais (langue ou il est le plus fiable), puis
NLLB la traduit vers la langue cible pour garantir que le texte est vraiment
dans la bonne langue.
"""

import re

from language import LANG_FR
from services import llm, translation, intent

_LEVELS_FR = {"debutant": "débutant", "intermediaire": "intermédiaire", "avance": "avancé"}

# NLLB ne connait pas le markdown : les ** / * / _ / ` finissent mal places
# dans la traduction (« instead ** with the ** spoon »).
_MARKDOWN_RE = re.compile(r"(\*\*|__|[*_`#])")


def _strip_markdown(text):
    return re.sub(r"\s{2,}", " ", _MARKDOWN_RE.sub("", text)).strip()


def respond(user_msg, history, target_lang, level):
    user_msg = (user_msg or "").strip()
    if not user_msg:
        return {"response": "Bonjour ! Comment puis-je vous aider ?"}

    # « Comment dit-on X en {langue} ? » — lookup de vocabulaire precis, plus
    # fiable via NLLB que via le LLM de chat (qui hallucine). Le petit modele
    # decide QUE c'est ce type de question ; le regex extrait QUOI traduire.
    # Sans extraction, pas de repli sur le message entier : le classifieur a
    # des faux positifs (« je veux dire le servant ») et le coach se contentait
    # alors de renvoyer la traduction du message.
    asked_word = intent.extract_asked_word(user_msg)
    if asked_word and intent.is_vocabulary_question(user_msg):
        try:
            translated_word = translation.translate(asked_word, "fr", target_lang)
            if translated_word:
                return {"response": translated_word}
        except Exception as e:
            print(f"Translation-question error: {e}")

    level_desc = _LEVELS_FR.get(level, "débutant")
    lang_name = LANG_FR.get(target_lang, target_lang)

    messages = [
        {
            "role": "system",
            "content": (
                f"Tu es Lingua Coach, un assistant chaleureux qui aide à apprendre cette langue : {lang_name}. "
                f"L'utilisateur est de niveau {level_desc}. "
                f"Réponds TOUJOURS en français, en 1 à 2 phrases courtes maximum, en texte brut "
                f"(jamais de markdown, d'astérisques ni de guillemets décoratifs). "
                f"Sois encourageant et continue la conversation naturellement. "
                f"Corrige UNIQUEMENT une vraie faute de grammaire ou de vocabulaire ; "
                f"si la phrase est correcte, ne corrige rien et n'invente pas d'erreur. "
                f"Si l'utilisateur écrit en français au lieu d'écrire en {lang_name}, "
                f"réponds à son message puis encourage-le à essayer d'écrire en {lang_name}."
            ),
        }
    ]

    for h in (history or [])[-6:]:
        if isinstance(h, dict) and h.get("role") in ("user", "assistant") and h.get("content"):
            messages.append({"role": h["role"], "content": h["content"]})

    messages.append({"role": "user", "content": user_msg})

    reply_fr = llm.generate(messages, max_tokens=80, temperature=0.7)

    if not reply_fr:
        reply_fr = "Merci pour ton message ! Continue à t'entraîner, tu progresses bien."

    reply_fr = _strip_markdown(reply_fr)

    result = reply_fr
    if target_lang != "fr":
        try:
            translated = translation.translate(reply_fr, "fr", target_lang)
            if translated:
                result = translated
        except Exception as e:
            print(f"Respond translation error: {e}")

    return {"response": result}
