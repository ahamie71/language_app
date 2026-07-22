"""
3.2 — Entraînement d'un modèle à échelle réduite.

Un petit classifieur de texte (embedding + réseau dense, quelques dizaines
de milliers de paramètres) entraîné ENTIÈREMENT à partir de zéro — pas de
poids pré-entraînés — pour détecter si un message de l'utilisateur est une
question de vocabulaire ("comment dit-on X en anglais ?") ou un message de
conversation normal.

Ce modèle sert ensuite dans l'app (voir intent_classifier.py / app.py) pour
router ces questions vers le traducteur NLLB plutôt que vers le LLM de chat,
qui a tendance à halluciner sur ce type de question précise (cf. section 3.3.4).

Usage: python train_intent_model.py
"""
import json
import random
import re

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

random.seed(42)
torch.manual_seed(42)

# ── 1. Génération d'un jeu de données synthétique ────────────────────────────

WORDS = [
    "une fourchette", "un couteau", "une cuillère", "un verre", "une assiette",
    "un chat", "un chien", "une voiture", "une maison", "un livre",
    "bonjour", "merci", "au revoir", "s'il vous plaît", "excusez-moi",
    "le soleil", "la lune", "une étoile", "la pluie", "le vent",
    "manger", "boire", "dormir", "courir", "marcher",
    "rouge", "bleu", "vert", "jaune", "noir",
    "un ordinateur", "un téléphone", "une table", "une chaise", "une fenêtre",
    "content", "triste", "fatigué", "heureux", "en colère",
]

LANGUAGES = ["anglais", "espagnol", "allemand", "italien", "portugais", "chinois", "japonais", "arabe"]

POSITIVE_TEMPLATES = [
    "comment dit-on {word} en {lang}",
    "comment dire {word} en {lang}",
    "comment on dit {word} en {lang}",
    "comment dire en {lang} {word}",
    "comment dit-on en {lang} {word}",
    "comment on prononce {word} en {lang}",
    "comment prononcer {word} en {lang}",
    "comment tu prononces {word} en {lang}",
    "comment épeler {word} en {lang}",
    "dis moi comment on dit {word} en {lang}",
    "dis moi comment on prononce {word} en {lang}",
    "sais-tu comment dire {word} en {lang}",
    "que veut dire {word} en {lang}",
    "quelle est la traduction de {word} en {lang}",
    "traduis {word} en {lang}",
    "traduis-moi {word} en {lang}",
    "traduction de {word} en {lang}",
    "{word} en {lang} ça se dit comment",
    "{word} en {lang} ça se prononce comment",
    "{word} comment ça se dit en {lang}",
    "c'est quoi {word} en {lang}",
    "tu peux traduire {word} en {lang}",
    "tu peux me dire {word} en {lang}",
    "je ne sais pas comment dire {word} en {lang}",
    "je ne sais pas comment prononcer {word} en {lang}",
]

NEGATIVE_TEMPLATES = [
    "bonjour comment allez-vous",
    "je m'appelle {word}",
    "j'aime beaucoup {word}",
    "je voudrais apprendre {lang}",
    "quel temps fait-il aujourd'hui",
    "je suis content de te parler",
    "peux-tu m'aider à progresser en {lang}",
    "donne moi {word}",
    "je ne comprends pas cette phrase",
    "peux-tu répéter s'il te plaît",
    "j'ai fait une erreur de grammaire",
    "merci beaucoup pour ton aide",
    "je pratique {lang} tous les jours",
    "raconte-moi une histoire en {lang}",
    "est-ce que tu parles {lang}",
    "j'ai visité un pays où on parle {lang}",
    "{word} est sur la table",
    "je vais acheter {word} demain",
    "il fait beau aujourd'hui",
    "à quelle heure on se retrouve",
    "je suis fatigué ce soir",
    "quel est ton plat préféré",
    "as-tu déjà voyagé en Europe",
    "explique-moi la conjugaison du verbe être",
]


def build_dataset():
    examples = []
    for tpl in POSITIVE_TEMPLATES:
        for word in WORDS:
            for lang in random.sample(LANGUAGES, 3):  # échantillonne pour limiter la taille
                text = tpl.format(word=word, lang=lang)
                examples.append((text, 1))
    for tpl in NEGATIVE_TEMPLATES:
        if "{word}" in tpl or "{lang}" in tpl:
            for word in random.sample(WORDS, 8):
                for lang in random.sample(LANGUAGES, 2):
                    text = tpl.format(word=word, lang=lang)
                    examples.append((text, 0))
        else:
            examples.append((tpl, 0))
            examples.append((tpl, 0))  # légère sur-représentation des phrases fixes

    random.shuffle(examples)
    return examples


# ── 2. Tokenisation simple (vocabulaire construit sur le jeu de données) ────

def tokenize(text):
    return re.findall(r"[a-zàâäéèêëïîôöùûüç']+", text.lower())


def build_vocab(examples):
    vocab = {"<pad>": 0, "<unk>": 1}
    for text, _ in examples:
        for tok in tokenize(text):
            if tok not in vocab:
                vocab[tok] = len(vocab)
    return vocab


def encode(text, vocab, max_len=16):
    ids = [vocab.get(tok, vocab["<unk>"]) for tok in tokenize(text)][:max_len]
    ids += [vocab["<pad>"]] * (max_len - len(ids))
    return ids


class IntentDataset(Dataset):
    def __init__(self, examples, vocab, max_len=16):
        self.examples = examples
        self.vocab = vocab
        self.max_len = max_len

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        text, label = self.examples[idx]
        ids = encode(text, self.vocab, self.max_len)
        return torch.tensor(ids, dtype=torch.long), torch.tensor(label, dtype=torch.float32)


# ── 3. Le modèle : petit réseau entraîné from scratch ────────────────────────
# Embedding -> moyenne -> 2 couches denses -> sigmoïde. Quelques dizaines de
# milliers de paramètres seulement (à comparer aux millions/milliards des
# modèles pré-entraînés utilisés ailleurs dans l'app).

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


def main():
    examples = build_dataset()
    random.shuffle(examples)
    split = int(len(examples) * 0.9)
    train_examples, val_examples = examples[:split], examples[split:]
    print(f"Dataset: {len(train_examples)} train / {len(val_examples)} val examples")

    vocab = build_vocab(examples)
    print(f"Vocab size: {len(vocab)}")

    train_ds = IntentDataset(train_examples, vocab)
    val_ds = IntentDataset(val_examples, vocab)
    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=64)

    model = IntentClassifier(vocab_size=len(vocab))
    n_params = sum(p.numel() for p in model.parameters())
    print(f"Model parameters: {n_params:,}")

    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    criterion = nn.BCEWithLogitsLoss()

    for epoch in range(15):
        model.train()
        total_loss = 0
        for x, y in train_loader:
            optimizer.zero_grad()
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for x, y in val_loader:
                logits = model(x)
                preds = (torch.sigmoid(logits) > 0.5).float()
                correct += (preds == y).sum().item()
                total += y.size(0)
        acc = correct / total if total else 0
        print(f"Epoch {epoch+1:2d} | loss={total_loss/len(train_loader):.4f} | val_acc={acc:.3f}")

    import os
    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), "models/intent_classifier.pt")
    with open("models/intent_vocab.json", "w", encoding="utf-8") as f:
        json.dump(vocab, f, ensure_ascii=False)
    print("Modèle sauvegardé dans models/intent_classifier.pt")


if __name__ == "__main__":
    main()
