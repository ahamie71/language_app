import os

from flask import Blueprint, request, jsonify, send_file, after_this_request

from controllers import speech_controller

bp = Blueprint("speech", __name__)


@bp.route("/transcribe", methods=["POST"])
def transcribe():
    """3.3.1 — Retranscription via Vosk (local, gratuit, hors-ligne)."""
    return jsonify(speech_controller.transcribe(
        request.files.get("audio"),
        request.form.get("language", "en"),
    ))


@bp.route("/tts", methods=["POST"])
def tts():
    """3.3.3 — Lecture de la traduction via Coqui TTS (local, gratuit)."""
    data = request.json or {}
    out_path, err = speech_controller.prepare_tts(
        data.get("text", ""), data.get("language", "en")
    )
    if err:
        body, status = err
        return jsonify(body), status

    @after_this_request
    def _cleanup(response):
        if os.path.exists(out_path):
            os.remove(out_path)
        return response

    return send_file(out_path, mimetype="audio/wav")


@bp.route("/speak", methods=["POST"])
def speak():
    """Legacy — kept for compatibility."""
    data = request.json or {}
    return jsonify(speech_controller.speak(
        data.get("text", ""), data.get("language", "en")
    ))
