# LinguaAI

Application web d'apprentissage des langues avec assistant IA — traduction, transcription vocale, synthèse vocale, explications grammaticales, conversation et exercices générés automatiquement. Tous les modèles IA tournent **en local**, gratuitement, sans clé API externe.

## Fonctionnalités

- **Traduction** — traduction de texte entre 9 langues (NLLB-200)
- **Transcription (Speech-to-Text)** — dicter un texte à l'oral (Vosk)
- **Synthèse vocale (Text-to-Speech)** — écouter une traduction (Coqui TTS, avec repli sur la synthèse vocale du navigateur pour l'arabe, le chinois et le japonais)
- **Explications** — grammaire, vocabulaire, contexte culturel adaptés au niveau (Qwen2.5-1.5B-Instruct)
- **Conversation IA** — coach conversationnel avec suivi de contexte et objectifs de session
- **Exercices** — génération de QCM
- **Suivi de progression** — statistiques utilisateur, vocabulaire enregistré, flashcards

Langues supportées : français, anglais, espagnol, allemand, arabe, italien, portugais, chinois, japonais.

## Stack technique

| Service | Techno |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, Sequelize, MySQL, JWT |
| AI Service | Python, Flask, NLLB-200, Qwen2.5-1.5B-Instruct, Vosk, Coqui TTS |
| Base de données | MySQL 8 |

## Architecture

```
Frontend (React, :5173)
    ↓
Backend (Node.js/Express, :8000)
    ↓
AI Service (Python/Flask, :5000)
    ↓
Modèles locaux : NLLB-200 · Qwen2.5-1.5B · Vosk · Coqui TTS
```

## Démarrage avec Docker (recommandé)

Prérequis : [Docker](https://www.docker.com/) et Docker Compose.

```bash
docker compose up -d --build
```

Services exposés :

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:18000 |
| AI Service | http://localhost:5000 |
| phpMyAdmin | http://localhost:8081 |
| MySQL | localhost:3307 |

Arrêter les services : `docker compose down` (ajouter `-v` pour aussi supprimer les volumes/caches des modèles).

## Démarrage manuel (sans Docker)

Trois services à lancer, chacun dans un terminal séparé.

### 1. Base de données

```bash
mysql -u root -p < backend/database/schema.sql
```

### 2. AI Service (Python)

```bash
cd ai_service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
python app.py
```

ffmpeg est requis pour la transcription (`ffmpeg -version` pour vérifier).
Démarre sur `http://localhost:5000`. Les modèles se téléchargent automatiquement au premier appel puis sont mis en cache (NLLB ~2.4 Go, Qwen2.5-1.5B ~3 Go, Vosk ~50-300 Mo/langue, Coqui TTS ~100-200 Mo/langue).

### 3. Backend (Node.js)

```bash
cd backend
npm install
npm start
```

Démarre sur `http://localhost:8000`. Variables d'environnement dans `backend/.env` (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `AI_SERVICE_URL`, `PORT`).

### 4. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Démarre sur `http://localhost:5173`. Variable d'environnement dans `frontend/.env` (`VITE_API_URL`).

## Structure du projet

```
language_app/
├── ai_service/       # Service Python/Flask — modèles IA (traduction, TTS, STT, explications, conversation)
├── backend/           # API Node.js/Express — auth, utilisateurs, conversations, vocabulaire
│   └── src/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       └── services/
├── frontend/           # Application React
│   └── src/
│       ├── pages/       # Dashboard, Conversation, Vocabulary, Flashcards, Exercises, Dictation, Progress...
│       ├── components/
│       └── services/
├── database/           # Schéma SQL
└── docker-compose.yml
```

## Documentation complémentaire

- [AI_SETUP_GUIDE.md](AI_SETUP_GUIDE.md) — détails d'installation et endpoints du service IA
- [ai_service/README.md](ai_service/README.md) — endpoints et modèles du service IA
- [backend/README.md](backend/README.md) — structure et configuration du backend
