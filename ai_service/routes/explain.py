from flask import Blueprint, request, jsonify

from controllers import explain_controller

bp = Blueprint("explain", __name__)


@bp.route("/explain", methods=["POST"])
def explain():
    """3.3.4 — Explications via le LLM local (gratuit)."""
    data = request.json or {}
    return jsonify(explain_controller.explain(
        data.get("text", ""),
        data.get("language", "en"),
        data.get("level", "debutant"),
    ))
