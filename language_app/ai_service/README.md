# AI Service - Language Learning

Service Python pour les fonctionnalités IA de l'application LinguaAI.

## Fonctionnalités

### 3.3.2. Traduction
- **Endpoint**: `POST /translate`
- Traduit du texte entre différentes langues
- Utilise OpenAI GPT-3.5-turbo

### 3.3.3. Lecture de la traduction (Text-to-Speech)
- **Endpoint**: `POST /speak`
- Prépare le texte pour la synthèse vocale
- Le navigateur gère la lecture audio via SpeechSynthesis API

### 3.3.4. Explications
- **Endpoint**: `POST /explain`
- Explications grammaticales
- Notes de vocabulaire
- Contexte culturel
- Conseils d'utilisation

### Conversation IA
- **Endpoint**: `POST /respond`
- Génère des réponses conversationnelles
- Maintient le contexte de la conversation
- Adapte le niveau selon l'utilisateur

## Installation

```bash
# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer la clé OpenAI
# Modifier le fichier .env et ajouter votre clé OPENAI_API_KEY

# Lancer le service
python app.py
```

Le service sera disponible sur `http://localhost:5000`

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
