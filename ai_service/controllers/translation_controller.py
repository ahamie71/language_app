"""/translate — traduction via NLLB-200."""

from language import LANG_EN
from services import translation


def translate(text, source_lang, target_lang):
    text = (text or "").strip()
    if not text:
        return {"translation": ""}

    tgt_name = LANG_EN.get(target_lang, target_lang)
    result = None
    try:
        result = translation.translate(text, source_lang, target_lang)
    except Exception as e:
        print(f"Translation error: {e}")

    if not result:
        result = f"[{tgt_name}] {text}"

    return {"translation": result}
