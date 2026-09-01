from flask import Blueprint, request, jsonify

from controllers import translation_controller

bp = Blueprint("translation", __name__)


@bp.route("/translate", methods=["POST"])
def translate():
    """3.3.2 — Traduction via NLLB-200 (local, gratuit)."""
    data = request.json or {}
    return jsonify(translation_controller.translate(
        data.get("text", ""),
        data.get("source_lang", "fr"),
        data.get("target_lang", "en"),
    ))
