const API_BASE_URL = "http://localhost:3000/api";

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export async function apiRequest(path, options = {}) {
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    // resposta sense JSON
  }

  if (!response.ok) {
    const message = data?.error || "Request failed";
    throw new Error(message);
  }

  return data;
}

/* ============================================
   CLASS ENDPOINTS
   ============================================ */

export async function getClasses() {
  const res = await apiRequest("/classes", { method: "GET" });
  return res.data || [];
}

export async function createClass(payload) {
  console.log("📤 Creating class with payload:", payload);
  const res = await apiRequest("/classes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log("✅ Class created:", res);
  return res.data;
}

export async function getClassById(classId) {
  console.log("📡 Fetching class details for ID:", classId);
  const res = await apiRequest(`/classes/${classId}`, { method: "GET" });
  console.log("✅ Class data loaded:", res);
  return res.data;
}

export async function addMemberToClass(classId, emails) {
  console.log("📤 Adding members to class:", { classId, emails });
  const res = await apiRequest(`/classes/${classId}/members`, {
    method: "POST",
    body: JSON.stringify({ emails }),
  });
  console.log("✅ Members added:", res);
  return res.data;
}

/* ============================================
   DOCUMENTS (FILES)
   ============================================ */

export async function getClassDocuments(classId) {
  console.log("📡 Fetching documents for class:", classId);
  const res = await apiRequest(`/classes/${classId}/documents`, { method: "GET" });
  return res.data || [];
}

export async function uploadClassDocument(classId, file) {
  console.log("📤 Uploading document for class:", classId, file && file.name);
  const token = getAccessToken();
  const form = new FormData();
  form.append("file", file);

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/classes/${classId}/documents`, {
    method: "POST",
    headers,
    body: form,
  });

  let data = null;
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) {
    throw new Error(data?.error || "Upload failed");
  }
  return data.data;
}

/* ============================================
   DOCUMENTS - GROUPS
   ============================================ */

export async function getGroupDocuments(groupId) {
  console.log("📡 Fetching documents for group:", groupId);
  const res = await apiRequest(`/groups/${groupId}/documents`, { method: "GET" });
  return res.data || [];
}

export async function uploadGroupDocument(groupId, file) {
  console.log("📤 Uploading document for group:", groupId, file && file.name);
  const token = getAccessToken();
  const form = new FormData();
  form.append("file", file);

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/documents`, {
    method: "POST",
    headers,
    body: form,
  });

  let data = null;
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) {
    throw new Error(data?.error || "Upload failed");
  }
  return data.data;
}

/* ============================================
   GROUP ENDPOINTS
   ============================================ */

export async function getGroups() {
  const res = await apiRequest("/groups", { method: "GET" });
  return res.data || [];
}

/* ============================================
   USERS ENDPOINTS (DM chat list)
   ============================================ */

/**
 * Retorna tots els usuaris registrats.
 *
 * Backend: GET /api/users
 * Response: { data: [{id, nom, cognom, email, role, createdAt}] }
 */
export async function getUsers() {
  const res = await apiRequest("/users", { method: "GET" });
  return res.data || [];
}

/* ============================================
   MESSAGES ENDPOINTS (DM history)
   ============================================ */

/**
 * Carrega l'historial DM entre l'usuari loguejat i `receiverId`.
 *
 * Backend: GET /api/messages?contextType=dm&receiverId=...&limit=...
 * Response: { messages: [...] }
 */
export async function getDmMessages(receiverId, limit = 50) {
  const params = new URLSearchParams({
    contextType: "dm",
    receiverId,
    limit: String(limit),
  });
  const res = await apiRequest(`/messages?${params.toString()}`, {
    method: "GET",
  });
  return res.messages || [];
}

/**
 * Carrega l'historial del xat d'una classe.
 *
 * Backend: GET /api/messages?contextType=class&contextId=...&limit=...
 * Response: { messages: [...] }
 */
export async function getClassMessages(classId, limit = 50) {
  const params = new URLSearchParams({
    contextType: "class",
    contextId: classId,
    limit: String(limit),
  });
  const res = await apiRequest(`/messages?${params.toString()}`, {
    method: "GET",
  });
  return res.messages || [];
}

/**
 * Carrega l'historial del xat d'un grup.
 *
 * Backend: GET /api/messages?contextType=group&contextId=...&limit=...
 * Response: { messages: [...] }
 */
export async function getGroupMessages(groupId, limit = 50) {
  const params = new URLSearchParams({
    contextType: "group",
    contextId: groupId,
    limit: String(limit),
  });
  const res = await apiRequest(`/messages?${params.toString()}`, {
    method: "GET",
  });
  return res.messages || [];
}

export async function createGroup(payload) {
  console.log("📤 Creating group with payload:", payload);
  const res = await apiRequest("/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log("✅ Group created:", res);
  return res.data;
}

export async function getGroupById(groupId) {
  console.log("📡 Fetching group details for ID:", groupId);
  const res = await apiRequest(`/groups/${groupId}`, { method: "GET" });
  console.log("✅ Full group response from API:", JSON.stringify(res, null, 2));
  return res.data;
}

export async function addMemberToGroup(groupId, emails) {
  console.log("📤 Adding members to group:", { groupId, emails });
  const res = await apiRequest(`/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ emails }),
  });
  console.log("✅ Members added to group:", res);
  return res.data;
}

/* ============================================
   JWT DECODING (basic)
   ============================================ */

export function decodeJWT(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    return null;
  }
}

export function getCurrentUser() {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  const decoded = decodeJWT(token);
  console.log("🔐 Decoded JWT:", decoded);
  return decoded;
}
