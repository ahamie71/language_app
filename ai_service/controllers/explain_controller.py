"""/explain — explications pedagogiques via le LLM local."""

from language import LANG_EN, LANG_FR
from services import llm

_LEVELS_EN = {"debutant": "beginner", "intermediaire": "intermediate", "avance": "advanced"}


def explain(text, language, level):
    text = (text or "").strip()
    if not text:
        return {"explanation": ""}

    lang_name  = LANG_EN.get(language, language)
    level_desc = _LEVELS_EN.get(level, level)

    result = llm.generate([
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

    return {"explanation": result}
