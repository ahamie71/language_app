#!/bin/sh
# Demarre le serveur Ollama puis (re)cree le modele derive lingua-llm.
set -e

ollama serve &
SERVER_PID=$!

echo "⏳ Attente du serveur Ollama..."
until ollama list >/dev/null 2>&1; do
  sleep 1
done

echo "⏳ Build du modele lingua-llm (pull de qwen3.5:4b au premier lancement)..."
ollama create lingua-llm -f /Modelfile
echo "✅ lingua-llm pret"

# Charge le modele EN VRAM des le demarrage pour que la 1re requete utilisateur
# ne paie pas le cold start. Avec OLLAMA_KEEP_ALIVE=-1 il y reste indefiniment.
# `ollama run` (present dans l'image) fait une generation courte puis rend la main.
echo "⏳ Chargement de lingua-llm en VRAM..."
echo "ok" | ollama run lingua-llm >/dev/null 2>&1 || true
echo "✅ lingua-llm charge en VRAM"

wait "$SERVER_PID"