"""/pronunciation — compare la transcription a la phrase attendue, score 0-100."""

import re

from services import llm


def _tokenize(s):
    return re.findall(r"\w+", s.lower())


def evaluate(expected, actual):
    expected = (expected or "").strip().lower()
    actual   = (actual or "").strip().lower()

    if not expected or not actual:
        return {"score": 0, "feedback": "Texte manquant."}

    exp_tokens = _tokenize(expected)
    act_tokens = _tokenize(actual)

    if not exp_tokens:
        return {"score": 0, "feedback": "Texte de référence vide."}

    matches = sum(1 for w in act_tokens if w in exp_tokens)
    score   = min(100, round((matches / len(exp_tokens)) * 100))

    feedback = llm.generate([
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

    if not feedback:
        if score >= 80:
            feedback = f"Excellent ! Score de {score}/100. Votre prononciation est très bonne !"
        elif score >= 50:
            feedback = f"Bien ! Score de {score}/100. Continuez à pratiquer pour améliorer votre prononciation."
        else:
            feedback = f"Score de {score}/100. Réécoutez le texte original et réessayez."

    return {"score": score, "feedback": feedback}
