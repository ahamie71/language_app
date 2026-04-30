// =========================
// CONFIG API
// =========================

// URL backend (Docker + Vite safe)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:18000";

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
// STATS
// =========================
export const getStats = async () => {
  const res = await fetch(`${API_URL}/api/user/stats`, {
    headers: headers(),
  });

  return res.json();
};