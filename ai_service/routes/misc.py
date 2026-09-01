from flask import Blueprint, request, jsonify

from controllers import misc_controller

bp = Blueprint("misc", __name__)


@bp.route("/health", methods=["GET"])
def health():
    return jsonify(misc_controller.health())


# ── Legacy (conserve pour compatibilite) ─────────────────────────────────────

@bp.route("/lesson", methods=["GET"])
def lesson():
    return jsonify(misc_controller.lesson())


@bp.route("/check", methods=["POST"])
def check():
    data = request.json or {}
    return jsonify(misc_controller.check(data.get("answer", ""), data.get("correct", "")))


@bp.route("/progress", methods=["GET"])
def progress():
    return jsonify(misc_controller.progress())
