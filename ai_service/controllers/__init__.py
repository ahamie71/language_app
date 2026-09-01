"""Logique metier.

Un controller recoit des valeurs simples (pas d'objet Flask), applique la
logique (prompts, repli, validation) et renvoie un dict serialisable. Les
blueprints de routes/ se chargent du parsing de requete et de jsonify().
"""
