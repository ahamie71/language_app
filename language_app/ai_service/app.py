from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import random
import openai

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration IA
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
USE_FREE_API = os.getenv('USE_FREE_API', 'true').lower() == 'true'

# Initialize OpenAI
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
    openai_client = openai
    print("✅ OpenAI API configured")
else:
    print("⚠️  No OpenAI API key - using free APIs only")
    openai_client = None

# APIs gratuites
LIBRETRANSLATE_URL = "https://libretranslate.com/translate"
MYMEMORY_URL = "https://api.mymemory.translated.net/get"

# Language codes mapping
LANG_CODES = {
    'fr': 'French',
    'en': 'English',
    'es': 'Spanish',
    'de': 'German',
    'ar': 'Arabic',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'ja': 'Japanese'
}

# LibreTranslate language codes
LIBRE_LANG_CODES = {
    'fr': 'fr',
    'en': 'en',
    'es': 'es',
    'de': 'de',
    'ar': 'ar',
    'it': 'it',
    'pt': 'pt',
    'zh': 'zh',
    'ja': 'ja'
}

# Language codes mapping
LANG_CODES = {
    'fr': 'French',
    'en': 'English',
    'es': 'Spanish',
    'de': 'German',
    'ar': 'Arabic',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'ja': 'Japanese'
}

# Language codes mapping
LANG_CODES = {
    'fr': 'French',
    'en': 'English',
    'es': 'Spanish',
    'de': 'German',
    'ar': 'Arabic',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'ja': 'Japanese'
}


# Mock functions for development
def mock_translate(text, source_lang, target_lang):
    """Mock translation function"""
    translations = {
        'fr': {
            'en': {'Bonjour': 'Hello', 'Au revoir': 'Goodbye', 'Merci': 'Thank you'},
            'es': {'Bonjour': 'Hola', 'Au revoir': 'Adiós', 'Merci': 'Gracias'},
            'de': {'Bonjour': 'Hallo', 'Au revoir': 'Auf Wiedersehen', 'Merci': 'Danke'}
        },
        'en': {
            'fr': {'Hello': 'Bonjour', 'Goodbye': 'Au revoir', 'Thank you': 'Merci'},
            'es': {'Hello': 'Hola', 'Goodbye': 'Adiós', 'Thank you': 'Gracias'},
            'de': {'Hello': 'Hallo', 'Goodbye': 'Auf Wiedersehen', 'Thank you': 'Danke'}
        }
    }
    
    # Simple mock: reverse the text or use predefined translations
    if source_lang in translations and target_lang in translations[source_lang]:
        return translations[source_lang][target_lang].get(text, f"[Mock] {text} (translated)")
    else:
        return f"[Mock translation] {text}"

def translate_with_libretranslate(text, source_lang, target_lang):
    """Traduire avec LibreTranslate (API gratuite)"""
    try:
        if source_lang not in LIBRE_LANG_CODES or target_lang not in LIBRE_LANG_CODES:
            return mock_translate(text, source_lang, target_lang)
            
        payload = {
            "q": text,
            "source": LIBRE_LANG_CODES[source_lang],
            "target": LIBRE_LANG_CODES[target_lang],
            "format": "text"
        }
        
        response = requests.post(LIBRETRANSLATE_URL, json=payload, timeout=10)
        if response.status_code == 200:
            result = response.json()
            return result.get('translatedText', mock_translate(text, source_lang, target_lang))
        else:
            return mock_translate(text, source_lang, target_lang)
    except Exception as e:
        print(f"Erreur LibreTranslate: {e}")
        return mock_translate(text, source_lang, target_lang)

def translate_with_mymemory(text, source_lang, target_lang):
    """Traduire avec MyMemory (API gratuite)"""
    try:
        if source_lang not in LIBRE_LANG_CODES or target_lang not in LIBRE_LANG_CODES:
            return mock_translate(text, source_lang, target_lang)
            
        lang_pair = f"{LIBRE_LANG_CODES[source_lang]}|{LIBRE_LANG_CODES[target_lang]}"
        params = {
            "q": text,
            "langpair": lang_pair
        }
        
        response = requests.get(MYMEMORY_URL, params=params, timeout=10)
        if response.status_code == 200:
            result = response.json()
            return result.get('responseData', {}).get('translatedText', mock_translate(text, source_lang, target_lang))
        else:
            return mock_translate(text, source_lang, target_lang)
    except Exception as e:
        print(f"Erreur MyMemory: {e}")
        return mock_translate(text, source_lang, target_lang)

def mock_explain(text, language, level):
    """Mock explanation function"""
    explanations = {
        'debutant': f"""
📝 **Points de grammaire :**
- Cette phrase utilise le présent simple
- Structure : Sujet + Verbe + Complément

📚 **Vocabulaire :**
- "{text[:20]}..." : mot principal de la phrase

🌍 **Contexte culturel :**
Cette expression est couramment utilisée en {LANG_CODES.get(language, language)}.

💡 **Conseils :**
Pratiquez cette structure dans vos conversations quotidiennes.
        """,
        'intermediaire': f"""
📝 **Analyse grammaticale :**
- Temps verbal : Présent
- Accord sujet-verbe respecté
- Pronoms utilisés correctement

📚 **Vocabulaire avancé :**
- Synonymes possibles : [liste de synonymes]
- Expressions idiomatiques liées

🌍 **Contexte sociolinguistique :**
Utilisé dans un registre {random.choice(['familier', 'standard', 'formel'])}.

💡 **Erreurs courantes :**
Attention à ne pas confondre avec des expressions similaires.
        """,
        'avance': f"""
📝 **Analyse linguistique approfondie :**
- Morphologie : [analyse détaillée]
- Syntaxe : [structure complexe]
- Sémantique : [nuances de sens]

📚 **Étude lexicale :**
- Étymologie : Origine {random.choice(['latine', 'germanique', 'arabe'])}
- Champs lexicaux associés

🌍 **Contexte culturel et historique :**
Cette expression trouve ses racines dans [contexte historique].

💡 **Usage stylistique :**
Employé dans la littérature {random.choice(['classique', 'moderne', 'contemporaine'])}.
        """
    }
    return explanations.get(level, explanations['debutant'])

def mock_respond(user_message, conversation_history, target_language):
    """Generate AI response using OpenAI ChatGPT"""
    
    if not openai_client:
        # Fallback to mock if no API key
        responses = {
            'fr': ["C'est très bien ! Continuez comme ça.", "Pouvez-vous répéter cette phrase ?"],
            'en': ["That's very good! Keep it up.", "Can you repeat that sentence?"],
        }
        return random.choice(responses.get(target_language, responses['en']))
    
    try:
        # Build conversation context
        lang_names = {
            'fr': 'French',
            'en': 'English',
            'es': 'Spanish',
            'de': 'German',
            'ar': 'Arabic',
            'it': 'Italian',
            'pt': 'Portuguese'
        }
        
        target_lang_name = lang_names.get(target_language, target_language)
        
        # System prompt for language tutor
        system_prompt = f"""You are a friendly and patient language tutor teaching {target_lang_name}. 
Your goals:
1. Respond naturally to the student's message in {target_lang_name}
2. Keep responses short (2-4 sentences) 
3. Use simple vocabulary for beginners
4. Gently correct mistakes by showing the correct version
5. Ask follow-up questions to keep the conversation going
6. Be encouraging and positive

Always respond in {target_lang_name} (except when explaining grammar)."""
        
        # Build message history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (last 6 messages for context)
        for msg in conversation_history[-6:]:
            messages.append({
                "role": "user" if msg.get('role') == 'user' else "assistant",
                "content": msg.get('content', '')
            })
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Call OpenAI API
        response = openai_client.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=150,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        return ai_response
        
    except Exception as e:
        print(f"OpenAI error: {e}")
        return f"[AI Error] Let's continue practicing! (Error: {str(e)})"


@app.route('/translate', methods=['POST'])
def translate():
    """
    3.3.2. Mise en place de la traduction
    Translate text from source language to target language
    """
    try:
        data = request.json
        text = data.get('text', '')
        source_lang = data.get('source_lang', 'fr')
        target_lang = data.get('target_lang', 'en')
        
        if USE_FREE_API:
            # Essayer LibreTranslate d'abord, puis MyMemory en fallback
            translation = translate_with_libretranslate(text, source_lang, target_lang)
            if translation.startswith("[Mock]"):
                translation = translate_with_mymemory(text, source_lang, target_lang)
        else:
            translation = mock_translate(text, source_lang, target_lang)
        
        return jsonify({
            'translation': translation,
            'source_lang': source_lang,
            'target_lang': target_lang
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/speak', methods=['POST'])
def speak():
    """
    3.3.3. Mise en place de la lecture de la traduction
    Generate text-to-speech audio (returns text for browser TTS)
    """
    try:
        data = request.json
        text = data.get('text', '')
        language = data.get('language', 'fr')
        
        # Return the text - browser will handle TTS
        return jsonify({
            'text': text,
            'language': language,
            'message': 'Use browser SpeechSynthesis API for audio playback'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/explain', methods=['POST'])
def explain():
    """
    3.3.4. Mise en place des explications
    Provide grammar, context, and usage explanations
    """
    try:
        data = request.json
        text = data.get('text', '')
        language = data.get('language', 'fr')
        level = data.get('level', 'debutant')
        
        # Pour l'instant, utiliser les mocks améliorés
        explanation = mock_explain(text, language, level)
        
        return jsonify({
            'explanation': explanation,
            'language': language,
            'level': level
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/respond', methods=['POST'])
def respond():
    """
    Generate AI response in conversation context
    """
    try:
        data = request.json
        user_message = data.get('user_message', '')
        conversation_history = data.get('conversation_history', [])
        target_language = data.get('target_language', 'en')
        
        # Pour l'instant, utiliser les mocks améliorés
        ai_response = mock_respond(user_message, conversation_history, target_language)
        
        return jsonify({
            'response': ai_response,
            'language': target_language
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'AI Language Service'})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🤖 AI Service starting on port {port}")
    print(f"📚 Translation: POST /translate")
    print(f"🔊 Text-to-Speech: POST /speak")
    print(f"💡 Explanations: POST /explain")
    print(f"💬 Conversation: POST /respond")
    app.run(host='0.0.0.0', port=port, debug=True)
