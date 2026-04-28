const API_URL = "http://localhost:8000"

// --- Conversations ---
export const getConversations = async () => {
  const token = getToken()
  if (!token) {
    console.error('No token found')
    throw new Error('Not authenticated')
  }
  const res = await fetch(`${API_URL}/conversations`, { headers: headers() })
  if (!res.ok) {
    throw new Error('Failed to fetch conversations')
  }
  return res.json()
}

export const createConversation = async () => {
  const token = getToken()
  if (!token) {
    console.error('No token found')
    throw new Error('Not authenticated')
  }
  const res = await fetch(`${API_URL}/conversations`, {
    method: "POST",
    headers: headers(),
  })
  if (!res.ok) {
    throw new Error('Failed to create conversation')
  }
  return res.json()
}

export const getMessages = async (conversationId) => {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    headers: headers(),
  })
  return res.json()
}

export const createMessage = async (messageData) => {
  const res = await fetch(`${API_URL}/conversations/messages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(messageData),
  })
  return res.json()
}

export const processMessage = async (messageData) => {
  const res = await fetch(`${API_URL}/conversations/process`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(messageData),
  })
  return res.json()
}

const _unused = "http://localhost:8000";

// Récupérer le token stocké
const getToken = () => localStorage.getItem("token");

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// --- Auth ---
export const register = async (data) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
    console.log('Token stored successfully');
  } else {
    console.error('No access_token in response:', data);
  }
  return data;
};

export const logout = () => localStorage.removeItem("token");

// --- User ---
export const getProfile = async () => {
  const res = await fetch(`${API_URL}/user/me`, { headers: headers() });
  return res.json();
};

export const updateProfile = async (profileData) => {
  const res = await fetch(`${API_URL}/user/me`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(profileData),
  });
  return res.json();
};

// --- Vocabulary ---
export const getVocabulary = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const res = await fetch(`${API_URL}/vocabulary?${queryParams}`, {
    headers: headers(),
  });
  return res.json();
};

export const addWord = async (wordData) => {
  const res = await fetch(`${API_URL}/vocabulary`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(wordData),
  });
  return res.json();
};

export const updateWordProgress = async (wordId, correct) => {
  const res = await fetch(`${API_URL}/vocabulary/${wordId}/progress`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ correct }),
  });
  return res.json();
};

export const deleteWord = async (wordId) => {
  const res = await fetch(`${API_URL}/vocabulary/${wordId}`, {
    method: "DELETE",
    headers: headers(),
  });
  return res.json();
};

export const getStats = async () => {
  const res = await fetch(`${API_URL}/user/stats`, { headers: headers() });
  return res.json();
};
