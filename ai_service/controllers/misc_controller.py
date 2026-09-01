"""/health + routes legacy conservees pour compatibilite."""


def health():
    return {"status": "ok", "ai": True}


def lesson():
    return {"lesson": "basics_1", "question": "Translate: Hello", "answer": "bonjour"}


def check(answer, correct):
    user_a  = (answer or "").lower().strip()
    correct = (correct or "").lower().strip()
    ok = user_a == correct
    return {"correct": ok, "explanation": "✅ Correct !" if ok else "❌ Incorrect, réessayez."}


def progress():
    return {"score": 0, "streak": 0, "mistakes": []}
