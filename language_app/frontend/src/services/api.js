// =========================
// CONFIG API
// =========================

// URL backend (Docker + Vite safe)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:18000";

// URL service IA
const AI_URL = import.meta.env.VITE_AI_URL || "http://localhost:5000";

console.log("🌐 API_URL =", API_URL);

// =========================
// TOKEN + HEADERS
// =========================
const getToken = () => localStorage.getItem("token");

const headers = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// =========================
// AUTH
// =========================
export const register = async (data) => {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
  }

  return data;
};

export const logout = () => {
  localStorage.removeItem("token");
};

// =========================
// CONVERSATIONS
// =========================
export const getConversations = async () => {
  const res = await fetch(`${API_URL}/api/conversations`, {
    headers: headers(),
  });

  return res.json();
};

export const createConversation = async () => {
  const res = await fetch(`${API_URL}/api/conversations`, {
    method: "POST",
    headers: headers(),
  });

  return res.json();
};

export const getMessages = async (conversationId) => {
  const res = await fetch(
    `${API_URL}/api/conversations/${conversationId}/messages`,
    {
      headers: headers(),
    }
  );

  return res.json();
};

export const createMessage = async (messageData) => {
  const res = await fetch(`${API_URL}/api/conversations/messages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(messageData),
  });

  return res.json();
};

export const processMessage = async (messageData) => {
  const res = await fetch(`${API_URL}/api/conversations/process`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(messageData),
  });

  return res.json();
};

// =========================
// USER
// =========================
export const getProfile = async () => {
  const res = await fetch(`${API_URL}/api/user/me`, {
    headers: headers(),
  });

  return res.json();
};

export const updateProfile = async (data) => {
  const res = await fetch(`${API_URL}/api/user/me`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(data),
  });

  return res.json();
};

// =========================
// VOCABULARY
// =========================
export const getVocabulary = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();

  const res = await fetch(`${API_URL}/api/vocabulary?${query}`, {
    headers: headers(),
  });

  return res.json();
};

export const addWord = async (wordData) => {
  const res = await fetch(`${API_URL}/api/vocabulary`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(wordData),
  });

  return res.json();
};

export const updateWordProgress = async (wordId, correct) => {
  const res = await fetch(
    `${API_URL}/api/vocabulary/${wordId}/progress`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ correct }),
    }
  );

  return res.json();
};

export const deleteWord = async (wordId) => {
  const res = await fetch(`${API_URL}/api/vocabulary/${wordId}`, {
    method: "DELETE",
    headers: headers(),
  });

  return res.json();
};

// =========================
// AI — SPEECH (3.3.1 + 3.3.3)
// =========================

/** 3.3.1 — Retranscription : envoie un blob audio à Whisper, retourne le texte */
export const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");
  const res = await fetch(`${AI_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });
  return res.json();
};

/** Génère un exercice QCM via l'IA */
export const generateExercise = async (targetLanguage, level, topic = "général") => {
  const res = await fetch(`${AI_URL}/exercise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_language: targetLanguage, level, topic }),
  });
  return res.json();
};

/** 3.3.3 — Lecture : envoie le texte à OpenAI TTS, retourne un blob audio MP3 */
export const speakText = async (text, language) => {
  const res = await fetch(`${AI_URL}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error("TTS failed");
  return res.blob();
};

// =========================
// STATS
// =========================
export const getStats = async () => {
  const res = await fetch(`${API_URL}/api/user/stats`, {
    headers: headers(),
  });
  return res.json();
};

export const recordActivity = async (type, xp = 0) => {
  const res = await fetch(`${API_URL}/api/user/activity`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ type, xp }),
  });
  return res.json();
};

// =========================
// SRS / FLASHCARDS
// =========================
export const getDueVocabulary = async () => {
  const res = await fetch(`${API_URL}/api/vocabulary/due`, {
    headers: headers(),
  });
  return res.json();
};

export const exportVocabulary = async () => {
  const res = await fetch(`${API_URL}/api/vocabulary/export`, {
    headers: headers(),
  });
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "vocabulaire.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// =========================
// AI — DICTÉE & PRONONCIATION
// =========================
export const generateDictationText = async (targetLanguage, level) => {
  const res = await fetch(`${AI_URL}/dictation-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_language: targetLanguage, level }),
  });
  return res.json();
};

export const checkPronunciation = async (expected, actual) => {
  const res = await fetch(`${AI_URL}/pronunciation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expected, actual }),
  });
  return res.json();
};