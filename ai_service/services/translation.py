"""Traduction locale via NLLB-200-distilled-600M (Meta).

Demarrage silencieux : `warmup()` charge le modele en RAM (CPU) sans toucher
au GPU. Le passage sur le device cible (`device_for("nllb")`) se fait a la
premiere traduction reelle.
"""

import config
from language import NLLB_LANG
from services.device import device_for

_model = None
_tokenizer = None
_device = "cpu"          # device courant du modele
_placed = False          # True une fois deplace sur le device cible


def _build():
    """Instancie tokenizer + modele en RAM (CPU). Pas de VRAM ici."""
    global _model, _tokenizer
    if _model is None:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        print(f"⏳ Chargement de {config.NLLB_MODEL} (traduction) en RAM...")
        _tokenizer = AutoTokenizer.from_pretrained(config.NLLB_MODEL)
        _model = AutoModelForSeq2SeqLM.from_pretrained(
            config.NLLB_MODEL, low_cpu_mem_usage=False
        )
        _model.eval()
        print("✅ NLLB-200 chargé en RAM (CPU)")
    return _model, _tokenizer


def _ensure_placed():
    """Deplace le modele sur son device cible au 1er usage reel."""
    global _device, _placed
    if not _placed:
        target = device_for("nllb")
        if target != _device:
            _model.to(target)
            _device = target
            print(f"✅ NLLB-200 déplacé sur {target}")
        _placed = True


def warmup():
    """Prechauffage silencieux : modele en RAM, GPU non sollicite."""
    _build()


def translate(text, source_lang, target_lang):
    if source_lang == target_lang:
        return text
    src = NLLB_LANG.get(source_lang, "fra_Latn")
    tgt = NLLB_LANG.get(target_lang, "eng_Latn")
    model, tok = _build()
    _ensure_placed()
    tok.src_lang = src
    inputs = tok(text, return_tensors="pt").to(_device)
    tgt_id = tok.convert_tokens_to_ids(tgt)
    out = model.generate(**inputs, forced_bos_token_id=tgt_id, max_new_tokens=200)
    return tok.batch_decode(out, skip_special_tokens=True)[0]
