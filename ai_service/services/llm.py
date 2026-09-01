"""LLM local via Ollama (modele derive `lingua-llm`, voir ollama/Modelfile)."""

import requests

import config


def generate(messages, max_tokens=300, temperature=0.7):
    """Genere du texte avec le LLM local, ou None en cas d'echec.

    `think: False` -> Qwen3.5 est un modele a raisonnement ; on desactive le
    bloc <think> (latence + parsing inutile pour nos usages).
    """
    try:
        r = requests.post(
            f"{config.OLLAMA_URL}/api/chat",
            json={
                "model": config.LLM_MODEL,
                "messages": messages,
                "stream": False,
                "think": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": temperature,
                },
            },
            timeout=120,
        )
        r.raise_for_status()
        return r.json()["message"]["content"].strip()
    except Exception as e:
        print(f"Local LLM error: {e}")
        return None
