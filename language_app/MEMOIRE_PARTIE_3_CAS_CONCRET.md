# Présentation de l'application

## Présentation fonctionnelle

**LinguaAI** est une application web d'apprentissage des langues, conçue pour accompagner un apprenant dans la pratique d'une langue étrangère au travers d'interactions variées : conversation, vocabulaire, exercices et dictée. L'application s'adresse à un public souhaitant progresser de façon autonome, avec un accompagnement personnalisé selon son niveau (débutant, intermédiaire, avancé) et sa paire de langues (langue native → langue cible).

L'application s'organise autour des modules suivants :

- **Authentification** (inscription / connexion) : chaque utilisateur dispose d'un profil indiquant sa langue native, la langue qu'il apprend, et son niveau.
- **Tableau de bord** : point d'entrée présentant une vue d'ensemble de la progression de l'utilisateur.
- **Conversation IA** : module central de l'application, permettant d'échanger avec un coach IA. L'utilisateur peut s'exprimer au clavier ou au micro dans sa langue native ; le coach répond dans la langue cible, avec une traduction et une explication grammaticale disponibles pour chaque échange, ainsi qu'une lecture audio des messages.
- **Vocabulaire et Flashcards** : les mots rencontrés au fil des conversations sont automatiquement extraits, traduits et ajoutés à une liste de vocabulaire personnelle. Un système de répétition espacée (algorithme SM-2, comparable à celui utilisé par des applications comme Anki) planifie la révision de chaque mot selon la performance de l'utilisateur, afin d'optimiser la mémorisation à long terme.
- **Exercices** : questions à choix multiples générées dynamiquement, portant sur le vocabulaire et la grammaire de la langue cible.
- **Dictée** : l'application génère et lit à voix haute un texte dans la langue cible, que l'utilisateur doit retranscrire par la voix ; un score de prononciation est ensuite calculé par comparaison avec le texte de référence.
- **Suivi de progression** : statistiques d'apprentissage (mots appris, exercices réalisés, séries de révisions, etc.).

L'ensemble de ces modules s'appuie sur les briques d'intelligence artificielle détaillées dans la partie « Cas concret » (traduction, reconnaissance vocale, synthèse vocale, génération de texte), qui constituent le cœur technique différenciant de l'application.

## Architecture technique

L'application repose sur une architecture en plusieurs services indépendants, communiquant entre eux via des API HTTP, et conteneurisés avec **Docker** afin de garantir un déploiement reproductible.

```
┌─────────────────────┐      ┌──────────────────────┐      ┌──────────────────────────┐
│   Frontend (React)  │ ───▶ │  Backend (Node.js /   │ ───▶ │  Service IA (Python /    │
│   Vite, port 5173   │ ◀─── │  Express), port 8000  │ ◀─── │  Flask), port 5000       │
└─────────────────────┘      └──────────┬───────────┘      └──────────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │  Base de données      │
                              │  MySQL 8              │
                              └──────────────────────┘
```

- **Frontend** : développé en **React** (avec Vite comme outil de build), il gère l'ensemble de l'interface utilisateur — pages, navigation, enregistrement audio via l'API `MediaRecorder` du navigateur, lecture audio, et communication avec le backend via des requêtes HTTP authentifiées (JWT).
- **Backend** : développé en **Node.js / Express**, il gère l'authentification des utilisateurs, la persistance des données (utilisateurs, conversations, vocabulaire, statistiques) via l'ORM **Sequelize** connecté à une base **MySQL**, et orchestre les appels vers le service d'intelligence artificielle pour enrichir les réponses (traduction, génération de réponse, explication).
- **Service IA** : développé en **Python / Flask**, il isole l'ensemble des traitements d'intelligence artificielle (reconnaissance vocale, traduction, synthèse vocale, génération de texte) dans un service dédié, indépendant du reste de l'application. Cette séparation permet de faire évoluer ou remplacer les modèles utilisés sans impacter le reste de l'architecture, et de gérer indépendamment les ressources nécessaires (mémoire, temps de calcul) à l'exécution des modèles.
- **Base de données** : **MySQL**, hébergeant les tables utilisateurs, conversations, messages, vocabulaire et statistiques.
- **Conteneurisation** : l'ensemble des services (frontend, backend, service IA, base de données, interface d'administration phpMyAdmin) est décrit dans un fichier `docker-compose.yml`, permettant de lancer l'intégralité de l'application avec une seule commande. Les modèles d'intelligence artificielle, téléchargés au premier appel, sont conservés dans des volumes Docker persistants afin d'éviter un nouveau téléchargement à chaque redémarrage des conteneurs.

Ce choix d'architecture en micro-services, avec un service IA isolé, constitue un prérequis technique important pour la partie « Cas concret » qui suit : il a permis d'itérer rapidement sur les modèles utilisés (remplacement de fournisseurs IA, changement de modèles) sans jamais devoir modifier le frontend ou le backend applicatif, seul le contrat d'API (endpoints REST) entre le backend et le service IA étant conservé stable.

---

# 3. Cas concret

Cette partie décrit la mise en œuvre concrète des briques d'intelligence artificielle intégrées à l'application LinguaAI. L'objectif était de proposer un assistant capable de comprendre la parole, de traduire, de restituer du texte à l'oral, et de fournir des explications pédagogiques.

## Démarche initiale et contrainte de coût

La première version de l'application reposait sur les API payantes d'**OpenAI** (GPT-4o-mini pour la génération de texte, Whisper pour la reconnaissance vocale, et l'API de synthèse vocale d'OpenAI pour la lecture audio). Cette approche présentait l'avantage d'une mise en œuvre rapide et d'une qualité de résultat élevée, mais s'est révélée **coûteuse à l'usage** : chaque appel (traduction, génération de réponse, transcription, synthèse vocale) étant facturé, le coût cumulé sur la durée du développement et des tests s'est avéré significatif au regard du cadre d'un projet étudiant.

Ce constat a motivé une réorientation complète du projet vers des solutions **gratuites et fonctionnant localement**, sans dépendance à une facturation à l'usage. C'est cette contrainte qui a structuré l'ensemble de la démarche présentée dans cette partie : d'une part l'entraînement d'un modèle simple à échelle réduite, développé intégralement dans le cadre de ce projet (section 3.2), et d'autre part l'intégration de solutions open-source existantes, choisies et assemblées pour reconstituer, sans frais, une chaîne de traitement complète équivalente à celle initialement bâtie sur OpenAI (section 3.3).

Cette transition n'a pas été immédiate : plusieurs pistes intermédiaires ont été explorées avant d'aboutir à l'architecture finale, notamment le recours à l'API d'inférence gratuite de Hugging Face, qui s'est révélée présenter d'importantes limitations (modèles de traduction et de génération de texte progressivement retirés de l'offre gratuite au cours du développement), avant de basculer vers une exécution entièrement locale des modèles, détaillée dans les sections suivantes.

---

## 3.1. Mise en place d'une IA de Speech-to-Text

### 3.1.1. Objectif

Convertir la voix de l'utilisateur en texte, afin qu'il puisse s'exprimer oralement dans l'application (conversation, dictée) plutôt que de taper systématiquement au clavier.

### 3.1.2. Choix technique : Vosk

Après avoir évalué plusieurs pistes (Whisper d'OpenAI, modèles hébergés sur Hugging Face), le choix s'est porté sur **Vosk**, un moteur de reconnaissance vocale open-source fonctionnant entièrement hors-ligne. Ce choix repose sur trois critères principaux : la **gratuité et le fonctionnement 100 % local** (aucune clé API, aucune facturation à l'usage), la **légèreté** (modèles de 40 à 300 Mo selon la langue, contre plusieurs Go pour Whisper-large), et le **multilinguisme** (modèles disponibles pour les 9 langues couvertes par l'application), avec une latence faible sur CPU grâce à l'architecture Kaldi.

### 3.1.3. Fonctionnement

1. Le navigateur enregistre la voix via l'API `MediaRecorder` (format WebM/Opus).
2. Le fichier est envoyé à l'endpoint `/transcribe` du micro-service Python, avec la langue parlée.
3. Il est converti en WAV mono 16 kHz PCM 16 bits via `ffmpeg`, format requis par Vosk.
4. Le modèle Vosk de la langue concernée est téléchargé à la demande puis mis en cache (volume Docker persistant).
5. Le moteur `KaldiRecognizer` traite l'audio par blocs et restitue la transcription à l'utilisateur.

### 3.1.4. Difficultés rencontrées

- **Format audio** : les premiers tests échouaient car les octets audio étaient transmis sans type MIME. Résolu en écrivant le fichier sur disque avec la bonne extension avant conversion `ffmpeg`.
- **Micro défectueux** : aucune transcription n'était produite malgré des requêtes valides. L'analyse du niveau audio (`ffmpeg -af volumedetect`) a révélé un signal quasi silencieux (-62 dB), révélant un problème matériel plutôt qu'un bug logiciel.

---

## 3.2. Entraînement d'un modèle à échelle réduite

### 3.2.1. Objectif

Au-delà de l'utilisation de modèles pré-entraînés, il paraissait pertinent de démontrer la capacité à concevoir et entraîner soi-même un modèle, même simple, pour résoudre un problème concret rencontré durant le développement.

Le problème identifié est le suivant : lorsqu'un utilisateur pose une question de type *« comment dit-on une fourchette en anglais ? »*, un grand modèle de langage (LLM) généraliste — même de taille réduite comme Qwen2.5 — a tendance à **halluciner** une réponse incorrecte plutôt que de simplement traduire le mot demandé, car il traite la question comme une requête conversationnelle ouverte plutôt que comme une demande de traduction ponctuelle.

L'objectif de cette section est donc d'entraîner un **classifieur d'intention** léger, capable de détecter ce type de question afin de la rediriger vers le moteur de traduction (NLLB, section 3.3.2), fiable pour ce cas d'usage, plutôt que vers le modèle conversationnel.

### 3.2.2. Constitution du jeu de données

En l'absence de jeu de données existant pour cette tâche très spécifique, un **jeu de données synthétique** a été généré par combinatoire :

- Une liste de **40 mots et expressions** du quotidien (objets, couleurs, verbes, formules de politesse, etc.).
- Une liste de **8 langues cibles** (anglais, espagnol, allemand, italien, portugais, chinois, japonais, arabe).
- **25 formulations types** pour les questions de vocabulaire (*« comment dit-on X en Y »*, *« comment on prononce X en Y »*, *« traduction de X en Y »*, *« que veut dire X en Y »*, etc.), reflétant la variété des formulations qu'un utilisateur réel pourrait employer.
- **24 formulations types** de messages de conversation normaux (salutations, questions sur la météo, expressions de sentiments, etc.), servant d'exemples négatifs.

La combinaison de ces éléments a permis de générer environ **2 900 exemples d'entraînement** et 320 exemples de validation, répartis équitablement entre les deux classes (question de vocabulaire / message normal).

### 3.2.3. Architecture du modèle

Le modèle a été conçu volontairement simple, afin de respecter l'esprit d'un modèle « à échelle réduite » :

1. **Tokenisation** : découpage du texte en mots via une expression régulière simple (pas de sous-mots type BPE), avec construction d'un vocabulaire à partir du seul jeu de données d'entraînement (146 tokens uniques).
2. **Couche d'embedding** : chaque mot est représenté par un vecteur de dimension 32, initialisé aléatoirement (aucun poids pré-entraîné).
3. **Pooling par moyenne** : les vecteurs des mots d'une phrase sont moyennés pour obtenir une représentation unique de la phrase, en ignorant le padding.
4. **Couches denses** : un réseau à deux couches entièrement connectées (32 → 32 → 1) avec activation ReLU, suivi d'une fonction sigmoïde pour produire une probabilité binaire.

Ce modèle ne comporte que **5 761 paramètres entraînables**, à comparer aux 3 milliards de paramètres du modèle conversationnel utilisé par ailleurs (Qwen2.5-3B) — un ratio de l'ordre de 1 pour 500 000, illustrant concrètement la notion de modèle « à échelle réduite ».

### 3.2.4. Entraînement

L'entraînement a été réalisé avec PyTorch :
- **Fonction de perte** : entropie croisée binaire (`BCEWithLogitsLoss`).
- **Optimiseur** : Adam, taux d'apprentissage de 1×10⁻³.
- **Durée** : 15 époques, réalisées en quelques secondes sur CPU standard (aucun GPU requis, cohérent avec la philosophie de légèreté du projet).

Résultats obtenus :

| Époque | Perte (train) | Précision (validation) |
|---|---|---|
| 1 | 0,415 | 93,1 % |
| 5 | 0,036 | 99,7 % |
| 10 | 0,004 | 100 % |
| 15 | 0,001 | 100 % |

Le modèle atteint 100 % de précision sur l'ensemble de validation dès la 7ᵉ époque.

### 3.2.5. Analyse critique et limites

Si la précision de validation est excellente, il convient de nuancer ce résultat : le jeu de validation étant issu de la **même distribution combinatoire** que le jeu d'entraînement (mêmes gabarits de phrases, même vocabulaire), cette précision mesure surtout la capacité du modèle à mémoriser des motifs syntaxiques précis plutôt qu'une compréhension sémantique profonde.

Des tests complémentaires sur des formulations légèrement différentes de celles vues à l'entraînement (par exemple l'omission d'un article : « chien » au lieu de « un chien ») ont montré que le modèle pouvait échouer à généraliser correctement. Ce constat illustre un compromis fondamental en apprentissage automatique : un modèle de très petite taille, entraîné sur un jeu de données synthétique limité, offre une excellente performance sur sa distribution d'entraînement mais une capacité de généralisation restreinte, contrairement à un grand modèle de langage pré-entraîné sur des corpus massifs et diversifiés.

Ce résultat a été traité comme un compromis acceptable : le modèle reste utilisé comme un filtre heuristique en amont du système, et en cas de non-détection, le message est simplement traité par le modèle conversationnel classique (dégradation progressive plutôt que blocage).

### 3.2.6. Intégration dans l'application

Le modèle entraîné (poids et vocabulaire) est sauvegardé au format `.pt` / `.json` et chargé au démarrage du service d'IA. Lors de la réception d'un message utilisateur dans le module de conversation, le classifieur est interrogé en premier :
- S'il détecte une question de vocabulaire, le mot ou l'expression concernée est extrait (via une expression régulière complémentaire) puis traduit directement via NLLB (section 3.3.2), garantissant une réponse fiable.
- Sinon, le message suit le circuit normal de génération de réponse conversationnelle (section 3.3.4).

---

## 3.3. Développement d'un outil utilisant des solutions existantes

Au-delà du modèle entraîné spécifiquement pour ce projet, l'essentiel des fonctionnalités d'intelligence artificielle de l'application repose sur l'assemblage de solutions open-source existantes, choisies pour leur gratuité, leur capacité à fonctionner localement, et leur qualité pour chaque tâche spécifique. Cette section détaille la mise en place de chacune de ces briques.

L'ensemble de ces modèles est orchestré par un micro-service Python (Flask), interrogé par le backend applicatif (Node.js) via des appels HTTP internes, lui-même consommé par le frontend (React).

### 3.3.1. Mise en place de la retranscription

Cf. section 3.1 pour le détail technique du choix et du fonctionnement de Vosk. Cette section correspond à son intégration concrète dans l'application, au travers de deux cas d'usage :
- Dans le module de **conversation**, l'utilisateur peut dicter un message au micro plutôt que de le taper, dans sa langue natale.
- Dans le module de **dictée**, l'utilisateur écoute un texte généré dans la langue qu'il apprend, puis le retranscrit oralement ; le texte obtenu est comparé au texte de référence pour produire un score de prononciation.

### 3.3.2. Mise en place de la traduction

**Modèle utilisé : NLLB-200-distilled-600M** (*No Language Left Behind*), développé par Meta AI, un modèle de traduction automatique multilingue capable de traduire directement entre 200 langues sans passer par un pivot.

**Justification du choix** : plusieurs alternatives ont été testées avant d'arrêter ce choix :
- Les API d'inférence gratuites de Hugging Face ne proposent plus, au moment du développement, d'accès gratuit à NLLB-200 hébergé (limitation constatée empiriquement lors des tests d'intégration).
- Une architecture alternative reposant sur des modèles bilingues spécialisés (Helsinki-NLP/OPUS-MT, un modèle par paire de langues) a été testée avec succès, mais nécessite une logique de « pivot » par l'anglais pour les paires de langues non directement couvertes, complexifiant l'architecture.
- Le déploiement de NLLB-200 **en local**, en le téléchargeant et en l'exécutant directement dans le micro-service via la bibliothèque `transformers`, s'est révélé être la solution la plus robuste : un seul modèle unifié gère les 9 langues de l'application, sans dépendance à la disponibilité d'une API externe.

**Fonctionnement** : le texte à traduire est encodé avec le code de langue source (norme FLORES-200, ex. `fra_Latn` pour le français), puis le modèle génère la traduction en forçant le jeton de langue cible en début de génération (`forced_bos_token_id`). Le temps de génération observé est inférieur à une seconde par phrase sur CPU.

**Usage dans l'application** : la traduction est utilisée à plusieurs endroits — traduction des messages échangés dans le module conversation, traduction des mots de vocabulaire extraits automatiquement pour les flashcards, et comme filet de sécurité pour garantir que les réponses du coach conversationnel sont bien produites dans la langue cible attendue par l'apprenant (le modèle de langage génère sa réponse en français, langue sur laquelle il est le plus fiable, puis NLLB la traduit vers la langue cible, garantissant la langue de sortie indépendamment de la fiabilité du LLM sur cette langue).

### 3.3.3. Mise en place de la lecture de la traduction

**Modèle utilisé : Coqui TTS**, une bibliothèque open-source de synthèse vocale (Text-to-Speech), avec des modèles de type VITS et Tacotron2 entraînés spécifiquement par langue.

**Modèles retenus par langue** :

| Langue | Modèle |
|---|---|
| Anglais | `tts_models/en/ljspeech/tacotron2-DDC` |
| Français | `tts_models/fr/css10/vits` |
| Espagnol | `tts_models/es/css10/vits` |
| Allemand | `tts_models/de/thorsten/vits` |
| Italien | `tts_models/it/mai_female/vits` |
| Portugais | `tts_models/pt/cv/vits` |

**Difficultés rencontrées** : le choix initial du modèle anglais (`ljspeech/vits`) s'est révélé défectueux — le modèle produisait systématiquement un signal audio silencieux (valeurs `NaN` converties en zéros lors de l'encodage), quel que soit le texte fourni en entrée. Ce dysfonctionnement a été diagnostiqué en inspectant directement les échantillons audio générés (analyse des valeurs minimales/maximales du signal), révélant l'absence totale de signal. Le remplacement par le modèle `tacotron2-DDC` a résolu le problème. De même, le modèle allemand nécessitait une dépendance supplémentaire non installée par défaut (le phonémiseur *Gruut*).

**Langues non couvertes** : Coqui TTS ne propose pas, au catalogue public, de modèle pré-entraîné pour le chinois, le japonais ou l'arabe dans le cadre de ce projet. Pour ces langues, l'application bascule automatiquement sur l'API `SpeechSynthesis` native du navigateur, une solution de repli garantissant une continuité de service au prix d'une qualité vocale moindre.

**Usage dans l'application** : un bouton de lecture audio est disponible sur chaque message du module conversation et sur le texte à retranscrire dans le module dictée.

### 3.3.4. Mise en place des explications

**Modèle utilisé : Qwen2.5-3B-Instruct**, un modèle de langage (LLM) open-source développé par Alibaba, exécuté localement via la bibliothèque `transformers`.

**Justification du choix** : plusieurs modèles ont été évalués successivement :
- **Mistral-7B-Instruct-v0.2** (quantisé, exécuté via `llama.cpp`) a d'abord été testé, conformément à une recommandation initiale. Les résultats se sont toutefois révélés peu fiables en pratique : non-respect systématique des consignes de langue, production de JSON invalide pour la génération d'exercices, et confusions sémantiques (par exemple interprétation erronée du mot « exercice » dans un contexte pédagogique).
- **Qwen2.5-1.5B-Instruct** a ensuite été testé et s'est révélé nettement plus fiable pour le respect des consignes de formatage et de langue, malgré une taille inférieure.
- Face à des cas de réponses incohérentes constatés en usage réel, le modèle a finalement été remplacé par **Qwen2.5-3B-Instruct**, offrant un meilleur compromis entre cohérence des réponses et temps d'inférence sur CPU (environ 10 secondes par réponse).

Ce cheminement illustre un enseignement important : la taille d'un modèle de langage n'est pas le seul facteur déterminant sa fiabilité pour une tâche donnée — la qualité de l'alignement (fine-tuning à l'instruction) du modèle choisi s'est révélée au moins aussi déterminante.

**Usages concrets** :
- **Explications grammaticales** : analyse d'une phrase et production d'une explication en français portant sur le vocabulaire, la grammaire et le contexte culturel.
- **Coach conversationnel** : génération de réponses dans le cadre d'un dialogue simulé, adaptées au niveau de l'apprenant (débutant, intermédiaire, avancé), la langue de sortie étant garantie par le mécanisme de traduction décrit en 3.3.2.
- **Génération d'exercices** : production dynamique de questions à choix multiples au format JSON, avec repli sur une banque de questions prédéfinies en cas d'échec de génération ou de format invalide (le format JSON produit par un petit modèle de langage n'étant pas garanti à 100 %, une extraction tolérante — via expression régulière et nettoyage des virgules superflues — a dû être mise en place).
- **Génération de textes de dictée** adaptés au niveau de l'apprenant.

---

## Synthèse

Le tableau suivant résume les technologies mises en œuvre pour chacune des fonctionnalités d'intelligence artificielle de l'application :

| Fonctionnalité | Technologie | Type |
|---|---|---|
| Reconnaissance vocale (3.1 / 3.3.1) | Vosk | Solution existante |
| Classification d'intention (3.2) | Modèle maison (5 761 paramètres) | **Entraîné dans le cadre du projet** |
| Traduction (3.3.2) | NLLB-200-distilled-600M (Meta) | Solution existante |
| Synthèse vocale (3.3.3) | Coqui TTS | Solution existante |
| Génération de texte / explications (3.3.4) | Qwen2.5-3B-Instruct | Solution existante |

L'ensemble de ces composants s'exécute **localement, sur processeur (CPU), sans dépendance à une API payante**, ce qui constitue une contrainte de conception forte du projet mais garantit sa reproductibilité et l'absence de coût récurrent, au prix d'un compromis assumé sur la qualité par rapport à des solutions commerciales (GPT-4o-mini, Whisper API, etc.), documenté et justifié tout au long de cette section.
