"""Blueprints Flask. Fins : parsing de requete + jsonify, tout le reste va
dans controllers/."""

from .translation import bp as translation_bp
from .explain import bp as explain_bp
from .conversation import bp as conversation_bp
from .speech import bp as speech_bp
from .practice import bp as practice_bp
from .pronunciation import bp as pronunciation_bp
from .misc import bp as misc_bp

_BLUEPRINTS = (
    misc_bp,
    translation_bp,
    explain_bp,
    conversation_bp,
    speech_bp,
    practice_bp,
    pronunciation_bp,
)


def register_routes(app):
    for bp in _BLUEPRINTS:
        app.register_blueprint(bp)
