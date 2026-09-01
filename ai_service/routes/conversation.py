from flask import Blueprint, request, jsonify

from controllers import conversation_controller

bp = Blueprint("conversation", __name__)


@bp.route("/respond", methods=["POST"])
def respond():
    """Conversation avec le coach IA (LLM local + NLLB pour la langue cible)."""
    data = request.json or {}
    return jsonify(conversation_controller.respond(
        data.get("user_message", ""),
        data.get("conversation_history", []),
        data.get("target_language", "en"),
        data.get("level", "debutant"),
    ))
