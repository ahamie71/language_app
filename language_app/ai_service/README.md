# AI Service - Language Learning

Service Python pour les fonctionnalités IA de l'application LinguaAI.
Tous les modèles tournent **en local, sur CPU, gratuitement** — aucune clé API,
aucun compte, aucun coût. Les modèles sont téléchargés automatiquement au
premier appel puis mis en cache (voir `docker-compose.yml`, volumes `hf_cache`,
`vosk_cache`, `tts_cache`).

## Fonctionnalités

### 3.3.1. Retranscription (Speech-to-Text)
- **Endpoint**: `POST /transcribe`
- Transcrit un fichier audio en texte
- Utilise **Vosk** (léger, 100% hors-ligne, un modèle par langue)

### 3.3.2. Traduction
- **Endpoint**: `POST /translate`
- Traduit du texte entre différentes langues
- Utilise **NLLB-200-distilled-600M** (Meta), en local

### 3.3.3. Lecture de la traduction (Text-to-Speech)
- **Endpoint**: `POST /tts`
- Synthèse vocale du texte traduit
- Utilise **Coqui TTS** (VITS, un modèle par langue). Non disponible pour
  ar/zh/ja — le frontend bascule alors sur la synthèse vocale du navigateur.

### 3.3.4. Explications
- **Endpoint**: `POST /explain`
- Explications grammaticales, vocabulaire, contexte culturel
- Utilise **Qwen2.5-1.5B-Instruct**, en local

### Conversation IA
- **Endpoint**: `POST /respond`
- Génère des réponses conversationnelles, maintient le contexte
- Utilise **Qwen2.5-1.5B-Instruct**, en local

## Installation

```bash
# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Installer les dépendances (télécharge torch/transformers/vosk/coqui-tts)
pip install -r requirements.txt

# ffmpeg est requis pour la transcription (conversion audio) :
# Windows: télécharger sur https://ffmpeg.org et l'ajouter au PATH
# Linux: apt-get install ffmpeg (déjà inclus dans le Dockerfile)

# Lancer le service
python app.py
```

Le service sera disponible sur `http://localhost:5000`.
Au premier appel de chaque fonctionnalité, le modèle correspondant est
téléchargé (NLLB ~2.4 Go, Qwen2.5-1.5B ~3 Go, Vosk ~50-300 Mo/langue,
Coqui TTS ~100-200 Mo/langue) puis mis en cache pour les appels suivants.

## Endpoints

### Health Check
```
GET /health
```

### Traduction
```
POST /translate
{
  "text": "Bonjour le monde",
  "source_lang": "fr",
  "target_lang": "en"
}
```

### Text-to-Speech
```
POST /speak
{
  "text": "Hello world",
  "language": "en"
}
```

### Explication
```
POST /explain
{
  "text": "Je suis allé au marché",
  "language": "fr",
  "level": "debutant"
}
```

### Réponse Conversation
```
POST /respond
{
  "user_message": "Bonjour, comment ça va?",
  "conversation_history": [],
  "target_language": "fr"
}
```

## Langues Supportées

- fr: Français
- en: Anglais
- es: Espagnol
- de: Allemand
- ar: Arabe
- it: Italien
- pt: Portugais
- zh: Chinois
- ja: Japonais
