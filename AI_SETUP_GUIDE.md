# Guide d'installation - Fonctionnalités AI

## 3.3.1. Mise en place de la retranscription
## 3.3.2. Mise en place de la traduction
## 3.3.3. Mise en place de la lecture de la traduction
## 3.3.4. Mise en place des explications

Tous les modèles IA tournent **en local, sur CPU, gratuitement** — aucune clé
API, aucun compte externe, aucun coût, aucune limite d'appels.

### Étape 1: Installer Python, ffmpeg et les dépendances

```bash
# Aller dans le dossier ai_service
cd language_app/ai_service

# Créer un environnement virtuel Python
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows:
venv\Scripts\activate

# Sur Linux/Mac:
source venv/bin/activate

# Installer les dépendances (télécharge torch, transformers, vosk, coqui-tts...)
pip install -r requirements.txt
```

ffmpeg est requis pour la transcription (conversion audio) :
- Windows : télécharger sur https://ffmpeg.org et l'ajouter au PATH
- Linux/Mac : `apt-get install ffmpeg` / `brew install ffmpeg`
- Avec Docker : déjà inclus dans le `Dockerfile`, rien à faire

### Étape 2: Démarrer le service AI Python

```bash
# Dans le dossier ai_service (environnement activé)
python app.py
```

Le service AI démarrera sur `http://localhost:5000`. Au premier appel de
chaque fonctionnalité, le modèle correspondant se télécharge automatiquement
puis reste en cache pour les appels suivants :
- NLLB-200 (traduction) : ~2.4 Go
- Qwen2.5-1.5B-Instruct (explications/conversation/exercices) : ~3 Go
- Vosk (transcription) : ~50-300 Mo par langue
- Coqui TTS (lecture) : ~100-200 Mo par langue

### Étape 3: Démarrer le backend Node.js

```bash
# Dans un autre terminal, aller dans le dossier backend
cd language_app/backend

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur
npm start
```

Le backend démarrera sur `http://localhost:import.meta.env.VITE_API_URL`

### Étape 4: Démarrer le frontend React

```bash
# Dans un autre terminal, aller dans le dossier frontend
cd language_app/frontend

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer l'application
npm run dev
```

Le frontend sera disponible sur `http://localhost:5173`

## Vérification

### Tester le service AI

```bash
curl http://localhost:5000/health
```

### Tester la traduction

```bash
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Bonjour le monde", "source_lang": "fr", "target_lang": "en"}'
```

### Tester les explications

```bash
curl -X POST http://localhost:5000/explain \
  -H "Content-Type: application/json" \
  -d '{"text": "Je suis allé au marché", "language": "fr", "level": "debutant"}'
```

## Fonctionnalités implémentées

### ✅ 3.3.1 Retranscription (Speech-to-Text)
- Transcrit un enregistrement micro en texte
- Utilise Vosk, en local, un modèle par langue
- Supporte: FR, EN, ES, DE, AR, IT, PT, ZH, JA

### ✅ 3.3.2 Traduction
- Traduction automatique entre langues
- Utilise NLLB-200 (Meta), en local
- Supporte: FR, EN, ES, DE, AR, IT, PT, ZH, JA

### ✅ 3.3.3 Lecture de la traduction (Text-to-Speech)
- Bouton audio sur chaque message
- Utilise Coqui TTS en local pour FR, EN, ES, DE, IT, PT
- Bascule sur l'API SpeechSynthesis du navigateur pour AR, ZH, JA (pas de
  modèle Coqui disponible pour ces langues)

### ✅ 3.3.4 Explications
- Explications grammaticales détaillées, notes de vocabulaire, contexte culturel
- Coach conversationnel et génération d'exercices QCM
- Utilise Qwen2.5-1.5B-Instruct, en local
- Adapté au niveau (débutant, intermédiaire, avancé)

## Architecture

```
Frontend (React)
    ↓
Backend (Node.js + Express) :import.meta.env.VITE_API_URL
    ↓
AI Service (Python + Flask) :5000
    ↓
Modèles locaux (NLLB-200, Qwen2.5-1.5B, Vosk, Coqui TTS — tous gratuits, CPU)
```

## Dépannage

### Le service AI ne démarre pas
- Vérifier que Python est installé: `python --version`
- Vérifier que l'environnement virtuel est activé
- Vérifier les dépendances: `pip list`

### La transcription échoue
- Vérifier que ffmpeg est installé et dans le PATH: `ffmpeg -version`

### Le premier appel est très lent
- Normal : le modèle se télécharge (quelques Go) puis se charge en mémoire.
  Les appels suivants sont rapides (quelques secondes).

### Le frontend ne reçoit pas les réponses
- Vérifier que les 3 services tournent (AI, Backend, Frontend)
- Vérifier les URLs dans les fichiers de configuration
- Ouvrir la console du navigateur pour les erreurs
