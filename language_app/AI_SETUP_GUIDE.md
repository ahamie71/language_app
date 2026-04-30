# Guide d'installation - Fonctionnalités AI

## 3.3.2. Mise en place de la traduction
## 3.3.3. Mise en place de la lecture de la traduction
## 3.3.4. Mise en place des explications

### Étape 1: Installer Python et les dépendances

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

# Installer les dépendances
pip install -r requirements.txt
```

### Étape 2: Configurer la clé OpenAI

1. Créer un compte sur https://platform.openai.com
2. Obtenir une clé API
3. Modifier le fichier `ai_service/.env` :
```
OPENAI_API_KEY=sk-votre_clé_api_ici
```

### Étape 3: Démarrer le service AI Python

```bash
# Dans le dossier ai_service (environnement activé)
python app.py
```

Le service AI démarrera sur `http://localhost:5000`

### Étape 4: Démarrer le backend Node.js

```bash
# Dans un autre terminal, aller dans le dossier backend
cd language_app/backend

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur
npm start
```

Le backend démarrera sur `http://localhost:import.meta.env.VITE_API_URL`

### Étape 5: Démarrer le frontend React

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
# Dans un navigateur ou avec curl
curl http://localhost:5000/health
```

Devrait retourner: `{"status": "healthy", "service": "AI Language Service"}`

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

### ✅ 3.3.2 Traduction
- Traduction automatique entre langues
- Utilise OpenAI GPT-3.5-turbo
- Supporte: FR, EN, ES, DE, AR, IT, PT, ZH, JA

### ✅ 3.3.3 Lecture de la traduction (Text-to-Speech)
- Bouton audio sur chaque message
- Utilise l'API SpeechSynthesis du navigateur
- Vitesse réduite pour l'apprentissage (0.9x)
- Support multilingue

### ✅ 3.3.4 Explications
- Explications grammaticales détaillées
- Notes de vocabulaire
- Contexte culturel
- Conseils d'utilisation
- Adapté au niveau (débutant, intermédiaire, avancé)

## Architecture

```
Frontend (React) 
    ↓
Backend (Node.js + Express) :import.meta.env.VITE_API_URL
    ↓
AI Service (Python + Flask) :5000
    ↓
OpenAI API (GPT-3.5-turbo)
```

## Dépannage

### Le service AI ne démarre pas
- Vérifier que Python est installé: `python --version`
- Vérifier que l'environnement virtuel est activé
- Vérifier les dépendances: `pip list`

### Erreur de clé API
- Vérifier que OPENAI_API_KEY est configuré dans `.env`
- Vérifier que la clé est valide sur platform.openai.com

### Le frontend ne reçoit pas les réponses
- Vérifier que les 3 services tournent (AI, Backend, Frontend)
- Vérifier les URLs dans les fichiers de configuration
- Ouvrir la console du navigateur pour les erreurs
