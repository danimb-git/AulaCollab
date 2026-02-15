<template>
  <!-- TOP BAR (mateixa que MoodleHomePage) -->
  <TopBar
    :isProfileOpen="showProfileDropdown"
    @toggle-left="toggleLeft"
    @toggle-chat="toggleChat"
    @toggle-profile="toggleProfile"
    @logout="handleLogout"
  />

  <main class="page">
    <!-- TÍTOL -->
    <h1 class="pageTitle">
      <!-- Wireframe: si ets prof posa "CLASSE X - VISTA DE PROFESSOR" -->
      {{ isTeacher ? `CLASSE ${classData?.nom || "..."} - VISTA DE PROFESSOR` : `CLASSE ${classData?.nom || "..."}` }}
    </h1>

    <!-- BANNER BOTONS (1 o 2 segons rol) -->
    <section class="wideBanner">
      <div class="wideBannerInner">
        <PrimaryButton class="btnGhost" type="button" @click="openStudentsList">
          Veure llistat d'alumnes
        </PrimaryButton>

        <PrimaryButton
          v-if="isTeacher"
          class="btnGhost"
          type="button"
          @click="openAddStudent"
        >
          Afegir un nou alumne (+)
        </PrimaryButton>
      </div>
    </section>

    <!-- DESCRIPCIÓ -->
    <section class="classDescription">
      <h2 class="subtitle">Descripció</h2>
      <p class="descText">
        {{ classData?.descripcio || "No hi ha descripció" }}
      </p>
    </section>

    <!-- BOTONS CHAT + VIDEO -->
    <section class="twoButtonsRow">
      <button class="bigActionBtn" type="button" @click="openClassChat">
        <span class="circleIcon"></span>
        <span>Chat de classe</span>
      </button>

      <button class="bigActionBtn" type="button" @click="handleVideoCall">
        <span>Videotrucada de classe</span>
        <span class="circleIcon"></span>
      </button>
    </section>

    <!-- LLISTAT FITXERS -->
    <section class="filesSection">
      <div class="filesList">
        <div
          v-for="f in files"
          :key="f.id"
          class="fileRow"
          @click="downloadFile(f)"
        >
          <span class="fileName">{{ f.nom || f.name || f.originalname || f.filename }}</span>
          <span class="fileDate">{{ f.created_at ? new Date(f.created_at).toLocaleString() : (f.date || '') }}</span>
        </div>
      </div>

      <!-- Només professor: botó per penjar fitxer -->
      <div class="filesFooter">
        <PrimaryButton
          v-if="isTeacher"
          class="btnSmall"
          type="button"
          @click="handleUploadFile"
        >
          Penjar un nou fitxer (+)
        </PrimaryButton>
      </div>
    </section>

    <!-- Botó: Tornar -->
    <section style="text-align: center; margin-top: 40px; margin-bottom: 20px">
      <button class="auth-link" type="button" @click="goBack">
        ← Tornar al llistat
      </button>
    </section>
  </main>

  <!-- MODAL: LLISTAT ALUMNES -->
  <AppModal v-if="showStudentsModal" @close="showStudentsModal = false">
    <div class="studentsModal">
      <h3 class="modalTitle">Alumnes</h3>

      <div class="studentsList">
        <div v-for="s in students" :key="s.id" class="studentItem">
          {{ s.name }}
        </div>
      </div>
    </div>
  </AppModal>

  <!-- MODAL: AFEGIR ALUMNE (només professor) -->
  <AppModal v-if="showAddStudentModal" @close="closeAddStudent">
    <div class="addStudentModal">
      <h3 class="modalTitle">Afegir alumne per email</h3>

      <FormField
        label="Correu electrònic"
        v-model="newStudentEmail"
        placeholder="alumne@exemple.com"
      />

      <div class="modalActions">
        <PrimaryButton class="btnSmall" type="button" @click="submitAddStudent">
          Afegir
        </PrimaryButton>
      </div>
    </div>
  </AppModal>

  <!-- MODAL: CHAT DE CLASSE (REAL: HTTP historial + Socket.IO realtime) -->
  <AppModal v-if="showChatModal" @close="closeClassChat">
    <div class="chatModal">
      <div class="chatMessages">
        <!-- Error / loading states (per entendre què passa si falla API o permisos) -->
        <div v-if="chatError" class="chatMsg" style="color: red;">
          ⚠️ {{ chatError }}
        </div>

        <div v-else-if="chatLoading" class="chatMsg" style="opacity: 0.7;">
          Carregant historial...
        </div>

        <div
          v-for="m in classMessages"
          :key="m.id"
          class="chatMsg"
        >
          <strong>{{ displaySender(m) }}:</strong> {{ m.text }}
        </div>

        <div
          v-if="!chatLoading && !chatError && classMessages.length === 0"
          class="chatMsg"
          style="opacity: 0.7;"
        >
          Encara no hi ha missatges. Escriu el primer.
        </div>
      </div>

      <div class="chatInputRow">
        <input
          class="chatInput"
          type="text"
          v-model="newMessage"
          placeholder="Escriu un missatge..."
          @keyup.enter="sendClassMessage"
        />
        <button class="chatSendBtn" type="button" @click="sendClassMessage">→</button>
      </div>
    </div>
  </AppModal>

  <!-- hidden file input -->
  <input ref="fileInput" type="file" style="display:none" @change="onFileSelected" />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  apiRequest,
  getClassById,
  addMemberToClass,
  getCurrentUser,
  getClassMessages,
  getClassDocuments,
  uploadClassDocument,
} from "../../services/api.js";

import { getSocket } from "../../services/socket.js";

import TopBar from "../../components/app/TopBar.vue";
import { toggleLeft, toggleChat, toggleProfile } from "../../composables/useShell";
import AppModal from "../../components/ui/AppModal.vue";

/**
 * ⚠️ Reutilitza els components d'auth (inputs/botons).
 * Canvia aquests imports si el teu projecte els té amb un altre nom.
 */
import FormField from "../../components/ui/FormField.vue";
import PrimaryButton from "../../components/ui/PrimaryButton.vue";

const route = useRoute();
const router = useRouter();

/* =========================================================
   A) ESTAT (real data + mock fins connectar backends)
   ========================================================= */

const classId = computed(() => route.params.id);
const classData = ref(null);
const loading = ref(true);
const error = ref("");

/**
 * Usuari actual (via /api/me)
 *
 * Per què no fem servir només `getCurrentUser()`?
 * - `getCurrentUser()` llegeix el JWT (payload) i no sempre porta nom/cognom.
 * - /api/me ens dóna dades més fiables i consistents.
 */
const me = ref(null);

// Determinar si és el propietari de la classe
const isTeacher = computed(() => {
  if (!classData.value) return false;
  const user = getCurrentUser();
  if (!user) return false;
  // Verificar si és el propietari (professor)
  return classData.value.professor_id === user.sub;
});

// Alumnes (carregats des del backend)
const students = ref([]);

// Fitxers (reals)
const files = ref([]);
const fileInput = ref(null);

/* =========================================================
   B) TOPBAR (mateixes funcionalitats que MoodleHomePage)
   ========================================================= */

const showProfileDropdown = ref(false);

function handleLogout() {
  localStorage.removeItem("accessToken");
  router.push("/auth/login");
}

/**
 * Carrega els detalls de la classe des del backend
 */
async function loadClassDetail() {
  loading.value = true;
  error.value = "";
  try {
    console.log("📡 Fetching class details for ID:", classId.value);
    classData.value = await getClassById(classId.value);
    console.log("✅ Class data loaded, checking role...");
    // Populate students list from backend response
    try {
      const raw = classData.value;
      let list = [];
      if (raw?.class_members && Array.isArray(raw.class_members)) {
        list = raw.class_members.map((m) => {
          const u = m.users || m.user || {};
          const name = u.nom || u.name || u.email || "Usuari";
          return { id: u.id || Date.now() + Math.random(), name };
        });
      } else if (raw?.members && Array.isArray(raw.members)) {
        list = raw.members.map((u) => ({ id: u.id || Date.now() + Math.random(), name: u.nom || u.name || u.email }));
      }
      students.value = list;
      // intentar carregar documents també
      try { await loadClassDocuments(); } catch (_) {}
    } catch (e) {
      console.warn("Could not parse students from class data", e);
      students.value = [];
    }
    // El rol s'actualitza automàticament via computed
    } catch (e) {
    error.value = e.message || "Error al caregar la classe";
    console.error("❌ Error loading class:", error.value);
  } finally {
    loading.value = false;
  }
}

/* =========================================================
   C) MODALS (llistat alumnes / afegir alumne / chat)
   ========================================================= */

const showStudentsModal = ref(false);
const showAddStudentModal = ref(false);
const showChatModal = ref(false);

function openStudentsList() {
  // Carregar detalls (inclou membres) abans de mostrar
  loadClassDetail();
  showStudentsModal.value = true;
}

const newStudentEmail = ref("");

function openAddStudent() {
  showAddStudentModal.value = true;
}

function closeAddStudent() {
  showAddStudentModal.value = false;
  newStudentEmail.value = "";
}

function submitAddStudent() {
  if (!newStudentEmail.value.trim()) return;

  // Afegir membre a la classe via API
  console.log("📝 Adding student:", newStudentEmail.value);
  addStudentByEmail(newStudentEmail.value.trim());
  closeAddStudent();
}

/**
 * Afegir alumne per email (connectat a backend)
 */
async function addStudentByEmail(email) {
  try {
    console.log("📤 Calling API to add member:", email);
    const result = await addMemberToClass(classId.value, [email]);
    console.log("✅ Member added successfully:", result);
    // Recarregar detalls per mostrar els nous membres
    await loadClassDetail();
  } catch (e) {
    console.error("❌ Error adding member:", e);
    alert("Error al afegir l'alumne: " + (e.message || "Error desconegut"));
  }
}

/* =========================================================
   D) CHAT DE CLASSE (REAL)
   =========================================================
   Objectiu: que el chat de classe funcioni com el DM:
   1) Historial (HTTP): GET /api/messages?contextType=class&contextId=<classId>
   2) Temps real (Socket.IO):
        - join_room { room: `class:<classId>` }
        - send_message { contextType:'class', contextId:<classId>, text }
        - new_message (broadcast a tots els membres connectats a la room)

   Diferència clau vs DM:
   - En DM la conversa es defineix per (jo + receiverId) i la room és `dm:a:b` (ordenada).
   - En classe la conversa es defineix per `classId` i la room és `class:<classId>`.
 */

// Llista de missatges reals que venen del backend:
// { id, text, senderId, receiverId, contextType, contextId, createdAt }
const classMessages = ref([]);
const newMessage = ref("");
const chatLoading = ref(false);
const chatError = ref("");

// Guardem quina room de classe tenim activa per poder fer leave quan tanquem el modal
const activeClassRoom = ref(null);

function buildClassRoom(id) {
  return `class:${id}`;
}

/**
 * Ens assegurem que tenim un socket connectat.
 *
 * IMPORTANT: reutilitzem el socket singleton (igual que DM) per evitar múltiples connexions.
 */
function requireSocket() {
  const socket = getSocket();
  if (!socket) throw new Error("No access token: cannot connect socket");
  return socket;
}

/**
 * Listener de `new_message` per xat de classe.
 *
 * Per què fem servir un guard (`__classChatListenerReady`)?
 * - Si registres el listener cada cop que obres el modal, acabes amb missatges duplicats.
 * - Amb el guard, el listener es registra una vegada.
 */
function ensureClassChatListener() {
  const socket = requireSocket();

  if (!socket.__classChatListenerReady) {
    socket.on("new_message", (msg) => {
      // Ens interessa només el context "class".
      if (!msg || msg.contextType !== "class") return;

      // Ens interessa només la classe que estem mirant.
      if (String(msg.contextId) !== String(classId.value)) return;

      // Afegim el missatge al final (el backend ja ordena per createdAt).
      classMessages.value = [...classMessages.value, msg];
    });

    socket.__classChatListenerReady = true;
  }

  return socket;
}

function leaveClassRoomIfNeeded() {
  const socket = getSocket();
  if (!socket) return;
  if (!activeClassRoom.value) return;

  socket.emit("leave_room", { room: activeClassRoom.value }, () => {
    // ack opcional
  });
  activeClassRoom.value = null;
}

/**
 * Obrir el xat de classe:
 * 1) obrir modal
 * 2) carregar historial via HTTP
 * 3) connectar socket + join room de classe
 */
async function openClassChat() {
  showChatModal.value = true;
  chatError.value = "";
  chatLoading.value = true;

  try {
    // 0) Ens assegurem que no quedem enganxats a una room antiga
    leaveClassRoomIfNeeded();

    // 1) Historial HTTP
    classMessages.value = await getClassMessages(classId.value, 100);

    // 2) Socket realtime
    const socket = ensureClassChatListener();

    const room = buildClassRoom(classId.value);
    activeClassRoom.value = room;

    socket.emit("join_room", { room }, (ack) => {
      if (ack && ack.ok === false) {
        console.warn("⚠️ join_room(class) failed:", ack.error);
      }
    });
  } catch (e) {
    chatError.value = e.message || "Error obrint el xat de classe";
    console.error("❌ openClassChat error:", chatError.value);
  } finally {
    chatLoading.value = false;
  }
}

/**
 * Tancar el xat de classe (quan el modal fa @close).
 */
function closeClassChat() {
  leaveClassRoomIfNeeded();
  showChatModal.value = false;
  newMessage.value = "";
}

/**
 * Enviar missatge a la classe via Socket.IO.
 *
 * Important:
 * - NO fem push manual del missatge a `classMessages`.
 * - Esperem el `new_message` del backend (això evita duplicats).
 */
function sendClassMessage() {
  const text = (newMessage.value || "").trim();
  if (!text) return;

  try {
    chatError.value = "";
    const socket = ensureClassChatListener();

    socket.emit(
      "send_message",
      {
        contextType: "class",
        contextId: classId.value,
        text,
      },
      (ack) => {
        if (ack && ack.ok === false) {
          chatError.value = ack.error || "No s'ha pogut enviar el missatge";
        }
      },
    );

    newMessage.value = "";
  } catch (e) {
    chatError.value = e.message || "Error enviant missatge";
  }
}

/**
 * Mostrar el nom de qui ha enviat un missatge.
 *
 * Com ho resol:
 * - Si el senderId és el meu id -> "Jo"
 * - Si tenim `classData.class_members` (getClassDetail ja l'inclou) -> busquem el nom.
 * - Fallback -> mostrem un tros d'UUID per debug.
 */
function displaySender(m) {
  const myId = me.value?.id;
  if (myId && String(m.senderId) === String(myId)) return "Jo";

  // Owner/professor (classData.users)
  const owner = classData.value?.users;
  if (owner && String(owner.id) === String(m.senderId)) {
    return [owner.nom, owner.cognom].filter(Boolean).join(" ") || owner.email;
  }

  // Membres
  const members = classData.value?.class_members || [];
  const member = members.find((cm) => String(cm?.users?.id) === String(m.senderId));
  if (member?.users) {
    const u = member.users;
    return [u.nom, u.cognom].filter(Boolean).join(" ") || u.email;
  }

  // Fallback (últims 6 caràcters)
  const id = String(m.senderId || "");
  return id ? `Usuari ${id.slice(-6)}` : "Usuari";
}

/* =========================================================
   E) FITXERS
   ========================================================= */

function downloadFile(file) {
  // ✅ BACKEND:
  // GET /classes/:id/files/:fileId (download)
  if (!file || !file.id) return;
  window.open(`${window.location.protocol}//${window.location.hostname}:3000/api/classes/${classId.value}/documents/${file.id}/download`,'_blank');
}

function handleUploadFile() {
  // Trigger hidden file input
  fileInput.value && fileInput.value.click();
}

async function onFileSelected(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  try {
    await uploadClassDocument(classId.value, f);
    // refresh documents
    await loadClassDocuments();
    alert('Fitxer pujat correctament');
  } catch (err) {
    console.error('Upload failed', err);
    alert('Error al pujar el fitxer: ' + (err.message || 'Error'));
  } finally {
    // clear input
    e.target.value = null;
  }
}

async function loadClassDocuments() {
  try {
    const docs = await getClassDocuments(classId.value);
    files.value = Array.isArray(docs) ? docs : [];
  } catch (e) {
    console.warn('Could not load class documents', e);
    files.value = [];
  }
}

/* =========================================================
   F) VIDEOTRUACADA
   ========================================================= */

function handleVideoCall() {
  // De moment sense funcionalitat (com has dit)
  console.log("Videotrucada (pending)");
}

/* =========================================================
   G) NAVEGACIÓ
   ========================================================= */

function goBack() {
  router.push("/moodle");
}

/* =========================================================
   G) ONMOUNTED: carregar dades reals
   ========================================================= */

onMounted(() => {
  // Carrega els detalls de la classe
  loadClassDetail();

  // Carrega l'usuari actual per poder identificar "Jo" en el chat
  apiRequest("/me")
    .then((data) => {
      me.value = data;
    })
    .catch(() => {
      // Si falla, no bloquegem tota la pàgina; el chat funcionarà però sense "Jo".
      me.value = null;
    });
});
</script>
