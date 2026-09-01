"""Couche d'acces aux modeles.

Chaque module charge son modele de facon paresseuse (au premier appel) et le
garde en singleton. Les controllers appellent ces fonctions, jamais les
modeles directement.
"""
