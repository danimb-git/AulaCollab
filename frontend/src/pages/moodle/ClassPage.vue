<template>
  <!-- TOP BAR (mateixa que MoodleHomePage) -->
  <TopBar
    :onToggleLeft="toggleLeft"
    :onToggleRight="toggleRight"
    :onToggleProfile="toggleProfile"
    :showProfileDropdown="showProfileDropdown"
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
          <span class="fileName">{{ f.name }}</span>
          <span class="fileDate">{{ f.date }}</span>
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
  <AppModal v-if="showVideoModal" @close="closeVideoModal">
  <div class="videoModal">
    <video ref="localVideoRef" autoplay playsinline muted style="width: 48%; background: #000;"></video>
    <video ref="remoteVideoRef" autoplay playsinline style="width: 48%; background: #000;"></video>
  </div>
</AppModal>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  apiRequest,
  getClassById,
  addMemberToClass,
  getCurrentUser,
  getClassMessages,
} from "../../services/api.js";

import { getSocket } from "../../services/socket.js";

import TopBar from "../../components/app/TopBar.vue";
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

// Alumnes
const students = ref([
  { id: 1, name: "Alumne 1" },
  { id: 2, name: "Alumne 2" },
  { id: 3, name: "Alumne 3" },
  { id: 4, name: "Alumne 4" },
  { id: 5, name: "Alumne 5" },
  { id: 6, name: "Alumne 6" },
  { id: 7, name: "Alumne 7" },
  { id: 8, name: "Alumne 8" },
  { id: 9, name: "Alumne 9" },
  { id: 10, name: "Alumne 10" },
  { id: 11, name: "Alumne 11" },
  { id: 12, name: "Alumne 12" },
]);

// Fitxers
const files = ref([
  { id: 1, name: "Fitxer 1", date: "01/01/2026" },
  { id: 2, name: "Fitxer 2", date: "02/01/2026" },
  { id: 3, name: "Fitxer 3", date: "03/01/2026" },
  { id: 4, name: "Fitxer 4", date: "04/01/2026" },
  { id: 5, name: "Fitxer 5", date: "05/01/2026" },
  { id: 6, name: "Fitxer 6", date: "06/01/2026" },
]);

/* =========================================================
   B) TOPBAR (mateixes funcionalitats que MoodleHomePage)
   ========================================================= */

const showProfileDropdown = ref(false);

function toggleLeft() {
  // ✅ Aquí aniria obrir el menú lateral esquerra (classes/grups)
  // Exemple: leftDrawerOpen.value = !leftDrawerOpen.value
  console.log("toggle left drawer");
}

function toggleRight() {
  // ✅ Aquí aniria obrir el menú lateral dret (chats)
  console.log("toggle right drawer");
}

function toggleProfile() {
  showProfileDropdown.value = !showProfileDropdown.value;
}

function handleLogout() {
  localStorage.removeItem("accessToken");
  router.push("/auth/login");
}

/**
 * Extreu el rol del JWT i determina si és professor
 */
/*
function loadUserRole() {
  const user = getCurrentUser();
  if (user && classData.value) {
    // Es professor si és owner de la classe o si és ADMIN
    isTeacher.value = user.id === classData.value.professor_id || user.rol === "ADMIN";
  }
}*/

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
  // ✅ BACKEND:
  // GET /classes/:id/students
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
    
    // Actualitzar la llista d'alumnes (mock per ara)
    students.value.push({
      id: Date.now(),
      name: email,
    });
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
  console.log("Download:", file);
}

function handleUploadFile() {
  // ✅ BACKEND:
  // POST /classes/:id/files (FormData)
  console.log("Upload file");
}

/* =========================================================
   F) VIDEOTRUACADA
   ========================================================= */
   
  const showVideoModal = ref(false);
  const localVideoRef = ref(null);
  const remoteVideoRef = ref(null);

  const localStream = ref(null);
  const remoteStream = ref(null);

  const peer = ref(null);
  const pendingCallerUserId = ref(null);
  const activeClassCall = ref(null);

  const rtcConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

   
  async function handleVideoCall() {
  try {
    showVideoModal.value = true;
    await startLocalMedia();

    const socket = getSocket();
    if (!socket) {
      alert("No hi ha socket connectat");
      return;
    }

    socket.emit("call_start", {
      context: "class",
      id: classId.value,
    });

    console.log(" Media local preparada");
    console.log(" call_start(class) enviat");
  } catch (e) {
    console.error("Error obrint càmera/mic:", e.message);
    alert("No s'ha pogut obrir càmera/mic");
  }
}

async function startLocalMedia() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localStream.value = stream;
  if (localVideoRef.value) {
    localVideoRef.value.srcObject = stream;
  }
}

function stopLocalMedia() {
  if (localStream.value) {
    localStream.value.getTracks().forEach((t) => t.stop());
    localStream.value = null;
  }
}

async function onClassCallInvite(payload) {
  if (!payload || payload.context !== "class") return;
  if (String(payload.id) !== String(classId.value)) return;

  console.log("📞 call_invite(class):", payload);
  activeClassCall.value = payload;

  const socket = getSocket();
  if (!socket) return;

  try {
    showVideoModal.value = true;
    await startLocalMedia();

    // acceptem automàticament per provar
    socket.emit("call_join", {
      context: "class",
      id: classId.value,
      callerUserId: payload.fromUserId,
    });
  } catch (e) {
    console.error("Error preparant media en rebre invite:", e.message);
  }
}


function onClassCallError(message) {
  console.error(" call_error(class):", message);
}

function onClassCallEnded(payload) {
  if (!payload) return;
  closeVideoModal();
}


function setupClassCallListeners() {
  const socket = getSocket();
  if (!socket) return;

  // evita registrar listeners més d'una vegada
  if (socket.__classCallListenersReady) return;

  socket.on("call_invite", onClassCallInvite);
  socket.on("call_joined", onClassCallJoined);
  socket.on("call_error", onClassCallError);

  socket.on("webrtc_offer", onWebrtcOffer);
  socket.on("webrtc_answer", onWebrtcAnswer);
  socket.on("webrtc_ice_candidate", onWebrtcIceCandidate);

  // si l'altre penja, tanquem modal
  socket.on("call_ended", onClassCallEnded);

  socket.__classCallListenersReady = true;
}

function cleanupClassCallListeners() {
  const socket = getSocket();
  if (!socket) return;

  socket.off("call_invite", onClassCallInvite);
  socket.off("call_joined", onClassCallJoined);
  socket.off("call_error", onClassCallError);

  socket.off("webrtc_offer", onWebrtcOffer);
  socket.off("webrtc_answer", onWebrtcAnswer);
  socket.off("webrtc_ice_candidate", onWebrtcIceCandidate);

  socket.off("call_ended", onClassCallEnded);

  socket.__classCallListenersReady = false;
}

function closeVideoModal() {
  const socket = getSocket();
  if (socket) {
    socket.emit("call_end", {
      context: "class",
      id: classId.value,
    });
  }

  if (peer.value) {
    peer.value.close();
    peer.value = null;
  }

  pendingCallerUserId.value = null;

  if (remoteVideoRef.value) {
    remoteVideoRef.value.srcObject = null;
  }
  remoteStream.value = null;

  stopLocalMedia();
  showVideoModal.value = false;
}



function createPeerConnection() {
  const pc = new RTCPeerConnection(rtcConfig);

  if (localStream.value) {
    localStream.value.getTracks().forEach((track) => pc.addTrack(track, localStream.value));
  }

  pc.ontrack = (event) => {
    const [stream] = event.streams;
    remoteStream.value = stream;
    if (remoteVideoRef.value) remoteVideoRef.value.srcObject = stream;
  };

  pc.onicecandidate = (event) => {
    if (!event.candidate) return;
    const socket = getSocket();
    if (!socket || !pendingCallerUserId.value) return;

    socket.emit("webrtc_ice_candidate", {
      context: "class",
      id: classId.value,
      targetUserId: pendingCallerUserId.value,
      candidate: event.candidate,
    });
  };

  peer.value = pc;
  return pc;
}

async function onClassCallJoined(payload) {
  if (!payload || payload.context !== "class") return;
  if (String(payload.id) !== String(classId.value)) return;

  pendingCallerUserId.value = payload.fromUserId;

  const pc = peer.value || createPeerConnection();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const socket = getSocket();
  socket.emit("webrtc_offer", {
    context: "class",
    id: classId.value,
    targetUserId: payload.fromUserId,
    sdp: offer,
  });

  console.log("✅ offer enviada");
}

async function onWebrtcOffer({ fromUserId, sdp }) {
  pendingCallerUserId.value = fromUserId;

  const pc = peer.value || createPeerConnection();
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  const socket = getSocket();
  socket.emit("webrtc_answer", {
    context: "class",
    id: classId.value,
    targetUserId: fromUserId,
    sdp: answer,
  });

  console.log("✅ answer enviada");
}
async function onWebrtcAnswer({ sdp }) {
  if (!peer.value) return;
  await peer.value.setRemoteDescription(new RTCSessionDescription(sdp));
  console.log("✅ answer rebuda");
}

async function onWebrtcIceCandidate({ candidate }) {
  if (!peer.value || !candidate) return;
  await peer.value.addIceCandidate(new RTCIceCandidate(candidate));
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
  setupClassCallListeners();


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

onUnmounted(() => {
  cleanupClassCallListeners();
  stopLocalMedia();
});

</script>
