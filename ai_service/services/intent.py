"""Detection "question de vocabulaire" (« comment dit-on X en {langue} ? »).

Deux briques :
  - un petit reseau entraine from scratch (train_intent_model.py, 5 569
    parametres) qui decide QUE le message est ce type de question ;
  - un jeu de regex qui extrait QUOI traduire une fois la decision prise.

Un LLM de chat hallucine facilement sur ce lookup de vocabulaire precis
(ex : « une fourchette se dit une fourchette en anglais ») ; on prefere donc
router ces messages vers NLLB (traduction).
"""

import os
import re

import config

_VOCAB_QUESTION_VERBS = r"dire|dit-on|dis-tu|dis tu|on dit|on prononce|prononcer|tu prononces|épeler|traduire|traduis"
_TRANSLATION_QUESTION_PATTERNS = [
    re.compile(rf"(?:comment|que)\s+(?:{_VOCAB_QUESTION_VERBS})(?:-moi|\s+moi)?\s+en\s+\w+\s+(.+?)[\?\.\!]*$", re.IGNORECASE),
    re.compile(rf"(?:comment|que)\s+(?:{_VOCAB_QUESTION_VERBS})(?:-moi|\s+moi)?\s+(.+?)\s+en\s+\w+[\?\.\!]*$", re.IGNORECASE),
    re.compile(rf"(.+?)\s+en\s+\w+\s+ça\s+se\s+(?:dit|prononce)\s+comment[\?\.\!]*$", re.IGNORECASE),
]


def extract_asked_word(text):
    """Mot/expression demande si le texte matche un pattern, sinon None."""
    for pattern in _TRANSLATION_QUESTION_PATTERNS:
        match = pattern.search(text)
        if match:
            word = match.group(1).strip(" '\"?.!")
            if word:
                return word
    return None


_model = None
_vocab = None


def _tokenize(text):
    return re.findall(r"[a-zàâäéèêëïîôöùûüç']+", text.lower())


def _encode(text, vocab, max_len=16):
    ids = [vocab.get(tok, vocab.get("<unk>", 1)) for tok in _tokenize(text)][:max_len]
    ids += [vocab.get("<pad>", 0)] * (max_len - len(ids))
    return ids


def _load():
    global _model, _vocab
    if _model is None:
        import json
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

        with open(os.path.join(config.INTENT_MODEL_DIR, "intent_vocab.json"), encoding="utf-8") as f:
            _vocab = json.load(f)
        model = IntentClassifier(vocab_size=len(_vocab))
        model.load_state_dict(torch.load(os.path.join(config.INTENT_MODEL_DIR, "intent_classifier.pt"), map_location="cpu"))
        model.eval()
        _model = model
        print("✅ Classifieur d'intention (modèle maison, 5 569 paramètres) chargé")
    return _model, _vocab


def warmup():
    """Prechauffage : charge le classifieur (CPU, ~5,5k parametres, negligeable)."""
    try:
        _load()
    except Exception as e:
        print(f"Intent warmup error: {e}")


def is_vocabulary_question(text):
    """True si le petit modele entraine detecte une question de vocabulaire."""
    try:
        import torch
        model, vocab = _load()
        ids = torch.tensor([_encode(text, vocab)], dtype=torch.long)
        with torch.no_grad():
            prob = torch.sigmoid(model(ids)).item()
        return prob > 0.5
    except Exception as e:
        print(f"Intent classifier error: {e}")
        return False
