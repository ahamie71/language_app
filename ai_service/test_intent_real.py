"""Évalue le classifieur d'intention sur des phrases réelles, jamais vues à l'entraînement."""
import json
import torch
from train_intent_model import IntentClassifier, encode

# 1 = question de vocabulaire, 0 = conversation
# Écrites à la main, avec des fautes et des tournures pièges
TESTS = [
    ("comment on dit chien en espagnol ?", 1),
    ("c koi pomme en anglais", 1),
    ("comment dit on 'bonjour' en japonais", 1),
    ("le mot voiture se dit comment en allemand ?", 1),
    ("je veux savoir comment on dit fraise en italien", 1),
    ("traduis-moi 'je suis fatigué' en anglais", 1),
    ("how do you say cat in spanish", 1),
    ("comment ça va aujourd'hui ?", 0),
    ("tu parles anglais ?", 0),
    ("comment on conjugue le verbe aller ?", 0),
    ("c'est quoi la différence entre ser et estar en espagnol", 0),
    ("raconte-moi comment tu as appris l'anglais", 0),
    ("explique-moi le subjonctif", 0),
    ("je ne sais pas parler allemand", 0),
    ("corrige ma phrase : I has a dog", 0),
    ("peux-tu me donner un exercice en italien", 0),
]

with open("models/intent_vocab.json", encoding="utf-8") as f:
    vocab = json.load(f)
model = IntentClassifier(vocab_size=len(vocab))
model.load_state_dict(torch.load("models/intent_classifier.pt"))
model.eval()

tp = tn = fp = fn = 0
print(f"{'phrase':55} attendu  prédit  proba")
for text, label in TESTS:
    x = torch.tensor([encode(text, vocab)])
    with torch.no_grad():
        prob = torch.sigmoid(model(x)).item()
    pred = int(prob > 0.5)
    mark = "" if pred == label else "  <-- ERREUR"
    print(f"{text[:55]:55} {label:^7} {pred:^6}  {prob:.2f}{mark}")
    if pred == 1 and label == 1: tp += 1
    elif pred == 0 and label == 0: tn += 1
    elif pred == 1 and label == 0: fp += 1
    else: fn += 1

n = len(TESTS)
print(f"\nAccuracy : {(tp+tn)/n:.0%}  ({tp+tn}/{n})")
print(f"Matrice de confusion : VP={tp}  VN={tn}  FP={fp}  FN={fn}")
prec = tp / (tp + fp) if tp + fp else 0
rec = tp / (tp + fn) if tp + fn else 0
rec0 = tn / (tn + fp) if tn + fp else 0
print(f"Vocabulaire : précision {prec:.0%}, rappel {rec:.0%}")
print(f"Conversation : rappel {rec0:.0%}  (conversations bien reconnues)")
