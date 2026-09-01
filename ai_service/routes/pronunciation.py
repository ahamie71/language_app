from flask import Blueprint, request, jsonify

from controllers import pronunciation_controller

bp = Blueprint("pronunciation", __name__)


@bp.route("/pronunciation", methods=["POST"])
def pronunciation():
    """Compare la transcription au texte attendu, renvoie un score 0-100."""
    data = request.json or {}
    return jsonify(pronunciation_controller.evaluate(
        data.get("expected", ""),
        data.get("actual", ""),
    ))
