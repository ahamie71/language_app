from flask import Blueprint, request, jsonify

from controllers import practice_controller

bp = Blueprint("practice", __name__)


@bp.route("/exercise", methods=["POST"])
def exercise():
    """Genere un exercice QCM dans la langue cible via le LLM local (gratuit)."""
    data = request.json or {}
    return jsonify(practice_controller.exercise(
        data.get("target_language", "en"),
        data.get("level", "debutant"),
        data.get("topic", "général"),
    ))


@bp.route("/dictation-text", methods=["POST"])
def dictation_text():
    """Texte de dictee via le LLM local (gratuit)."""
    data = request.json or {}
    return jsonify(practice_controller.dictation_text(
        data.get("target_language", "en"),
        data.get("level", "debutant"),
    ))
