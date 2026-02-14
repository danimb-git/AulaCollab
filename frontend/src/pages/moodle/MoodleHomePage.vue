<template>
  <div class="app-shell">
    <!-- 1) BARRA SUPERIOR (sempre visible) -->
    <TopBar
      :isProfileOpen="isProfileMenuOpen"
      :profileName="profileName"
      @toggle-left="onClickHamburger"
      @toggle-chat="onClickChatIcon"
      @toggle-profile="onClickProfile"
      @logout="onLogout"
    />

    <!-- 2) OVERLAY: quan hi ha algun menú lateral obert, fem fons semi-transparent.
         Si cliques fora, es tanca tot. -->
    <div
      v-if="leftMenuOpen || chatMenuOpen"
      class="overlay"
      @click="closeSidePanels"
    ></div>

    <!-- 3) MENÚ LATERAL ESQUERRE (classes i grups) -->
    <LeftDrawer
      v-if="leftMenuOpen"
      :classes="classes"
      :groups="groups"
      :showGroups="isStudent"
      @go-class="goToClass"
      @go-group="goToGroup"
    />

    <!-- 4) MENÚ LATERAL DRET (xats) -->
    <RightChatDrawer
      v-if="chatMenuOpen"
      :chats="dmUsers"
      :selectedChatId="selectedChatId"
      :selectedUser="selectedChatUser"
      :currentUserId="currentUser?.id"
      :messages="dmMessages"
      :loadingMessages="dmLoading"
      :errorMessage="dmError"
      @select-chat="openChat"
      @back="closeChatConversation"
      @send-message="sendDmMessage"
    />

    <!-- 5) TÍTOL CENTRAL -->
    <h1 class="moodle-title">
      {{ isStudent ? "MOODLE" : "MOODLE - PROFESSORS" }}
    </h1>

    <!-- Loading indicator -->
    <div v-if="loading" style="text-align: center; padding: 20px; color: #999;">
      Carregant dades...
    </div>

    <!-- Error indicator -->
    <div v-if="error" style="text-align: center; padding: 20px; color: red;">
      ⚠️ {{ error }}
    </div>

    <!-- 6) CONTINGUT CENTRAL (cards) -->
    <main class="main">
      <!-- Si és professor: només 1 columna. Si és alumne: 2 columnes -->
      <div
        class="columns"
        :style="{ gridTemplateColumns: isStudent ? '1fr 1fr' : '1fr' }"
      >
        <!-- 6A) SECCIÓ CLASSES (sempre) -->
        <section>
          <div class="section-header">
            <h3 class="title">Classes</h3>

            <!-- Només professor pot crear classe -->
            <button v-if="!isStudent" class="create-btn" @click="goToCreateClass">
              Crear una classe (+)
            </button>
          </div>

          <div class="cards">
            <div
              v-for="c in classes"
              :key="c.id"
              class="card"
              @click="goToClass(c.id)"
            >
              <div class="card-thumb"></div>
              <p class="card-name">{{ c.nom }}</p>
              <div class="card-arrow">→</div>
            </div>
          </div>
        </section>

        <!-- 6B) SECCIÓ GRUPS (només alumne) -->
        <section v-if="isStudent">
          <div class="section-header">
            <h3 class="title">Grups d’estudi</h3>
            <button class="create-btn" @click="goToCreateGroup">Crear un grup d’estudi (+)</button>
          </div>

          <div class="cards">
            <div
              v-for="g in groups"
              :key="g.id"
              class="card"
              @click="goToGroup(g.id)"
            >
              <div class="card-thumb"></div>
              <p class="card-name">{{ g.nom }}</p>
              <div class="card-arrow">→</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
/**
 * MoodleHomePage.vue
 *
 * Aquesta és la pàgina principal després de fer login.
 *
 * Actualment:
 *  - Les dades són MOCK (arrays locals).
 *  - No hi ha connexió real amb backend.
 *
 * Més endavant:
 *  - Les classes vindran de GET /classes
 *  - Els grups vindran de GET /groups
 *  - Els xats vindran de GET /chats o via WebSocket
 */

import { ref, onMounted, computed, onActivated } from "vue";
import { useRouter } from "vue-router";
import { apiRequest, getClasses, getGroups, getUsers, getDmMessages } from "../../services/api.js";

// Socket.IO (DM realtime)
import { getSocket, disconnectSocket, buildDmRoom } from "../../services/socket.js";

import TopBar from "../../components/app/TopBar.vue";
import LeftDrawer from "../../components/app/LeftDrawer.vue";
import RightChatDrawer from "../../components/app/RightChatDrawer.vue";


const router = useRouter();

/* =========================================================
   A) DADES (MOCK)
   ========================================================= */

/**
 * BACKEND:
 * Aquí NO haurien de ser arrays fixos.
 *
 * Aquí faríem:
 *
 *   onMounted(async () => {
 *     const response = await api.get("/classes")
 *     classes.value = response.data
 *   })
 *
 * I el mateix per grups.
 */

const mockClasses = ref([
  { id: 1, name: "Classe 1" },
  { id: 2, name: "Classe 2" },
  { id: 3, name: "Classe 3" },
]);

const mockGroups = ref([
  { id: 1, name: "Grup d’estudi 1" },
  { id: 2, name: "Grup d’estudi 2" },
]);
// Data real del backend
const classes = ref([]);
const groups = ref([]);
const loading = ref(false);
const error = ref("");

/**
 * DM Chats (usuaris + historial)
 *
 * Objectiu:
 * - Al RightChatDrawer es mostren tots els usuaris registrats (excepte jo).
 * - Quan selecciono un usuari:
 *    1) Carrego historial via HTTP GET /api/messages?contextType=dm&receiverId=...
 *    2) Em connecto a Socket.IO i faig join a la room DM
 *    3) Envio/rep missatges en temps real (event: new_message)
 */
const currentUser = ref(null);
const dmUsers = ref([]);
const dmMessages = ref([]);
const dmLoading = ref(false);
const dmError = ref("");

// Guardem la room actual per poder fer leave quan canviem de conversa
const activeDmRoom = ref(null);

/* =========================================================
   B) ESTAT UI
   ========================================================= */

const leftMenuOpen = ref(false);
const chatMenuOpen = ref(false);
const isProfileMenuOpen = ref(false);
const selectedChatId = ref(null);

/* =========================================================
   C) ROL (extret del JWT)
   ========================================================= */



/**
 * Extreu el rol del JWT token
 */
/*function loadUserRole() {
  const user = getCurrentUser();
  if (user) {
    // Backend usa "role" en JWT (ALUMNE, PROFESSOR, ADMIN)
    console.log("👤 User role from JWT:", user.role);
    role.value = user.role;
  }
}*/
  const role = ref(null);
  const isStudent = computed(() => role.value === "ALUMNE");

// Nom a mostrar al botó de perfil (TopBar)
const profileName = computed(() => {
  const u = currentUser.value;
  if (!u) return "Perfil";
  const fullName = [u.nom, u.cognom].filter(Boolean).join(" ").trim();
  return fullName || u.email || "Perfil";
});

// Usuari seleccionat al xat
const selectedChatUser = computed(() => {
  if (!selectedChatId.value) return null;
  return dmUsers.value.find((u) => String(u.id) === String(selectedChatId.value)) || null;
});


/* =========================================================
   D) FUNCIONS
   ========================================================= */

function closeSidePanels() {
  leftMenuOpen.value = false;
  chatMenuOpen.value = false;
  isProfileMenuOpen.value = false;
  selectedChatId.value = null;
  dmMessages.value = [];
}

function onClickHamburger() {
  leftMenuOpen.value = !leftMenuOpen.value;
  chatMenuOpen.value = false;
  isProfileMenuOpen.value = false;
}

function onClickChatIcon() {
  chatMenuOpen.value = !chatMenuOpen.value;
  leftMenuOpen.value = false;
  isProfileMenuOpen.value = false;
}

function onClickProfile() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value;
}



/**
 * BACKEND LOGOUT:
 * Aquí aniria:
 *
 * 1. Petició POST /auth/logout
 * 2. Esborrar token del localStorage
 * 3. Redirigir a /auth/login
 */
 function onLogout() {
  localStorage.removeItem("accessToken");
  // Si tanques sessió, desconnectem el socket per evitar que segueixi escoltant.
  disconnectSocket();
  router.push("/auth/login");
}


/**
 * NAVEGACIÓ A CLASSE
 */
function goToClass(classId) {
  router.push(`/classes/${classId}`);
}

/**
 * 📡 NAVEGACIÓ A GRUP
 */
function goToGroup(groupId) {
  console.log("🔗 Navigating to group:", groupId);
  router.push(`/groups/${groupId}`);
}

function goToCreateClass() {
  router.push("/moodle/classes/create");
}

function goToCreateGroup() {
  router.push("/moodle/groups/create");
}

/**
 * 💬 XATS
 *
 * Més endavant:
 * - Obrir WebSocket
 * - Subscriure's a sala
 * - Rebre missatges en temps real
 */
function openChat(chatId) {
  // `chatId` aquí és l'id de l'usuari receptor (amb qui faré DM)
  selectedChatId.value = chatId;

  // Carreguem historial + connectem realtime
  loadDmConversation(chatId);
}

function closeChatConversation() {
  // Surto de la conversa actual (leave room) però mantinc el socket connectat.
  // Això fa que si torno a obrir un altre chat, sigui més ràpid.
  leaveActiveDmRoom();

  selectedChatId.value = null;
  dmMessages.value = [];
}

/**
 * Carrega usuaris per la llista de DM.
 * Backend: GET /api/users
 */
async function loadDmUsers() {
  dmError.value = "";
  try {
    const users = await getUsers();

    // No volem que aparegui "jo mateix" a la llista de DMs
    const meId = currentUser.value?.id;
    dmUsers.value = meId
      ? users.filter((u) => String(u.id) !== String(meId))
      : users;
  } catch (e) {
    dmError.value = e.message || "Error carregant usuaris";
    console.error("❌ Error loading users:", dmError.value);
  }
}

/**
 * Assegura que el socket estigui connectat i que tinguem el listener per new_message.
 *
 * IMPORTANT:
 * - Només volem registrar el listener UNA vegada.
 * - Si el registrem cada cop que obres un chat, acabaries rebent missatges duplicats.
 */
function ensureSocketAndListeners() {
  const socket = getSocket();
  if (!socket) {
    throw new Error("No access token: cannot connect socket");
  }

  // Marquem al socket si ja hem inicialitzat listeners
  if (!socket.__dmListenersReady) {
    socket.on("new_message", (msg) => {
      // Aquest event l'emet el backend quan s'ha guardat un missatge.
      // Nosaltres decidim si pertany a la conversa oberta.
      if (!msg || msg.contextType !== "dm") return;

      const meId = currentUser.value?.id;
      const otherId = selectedChatId.value;
      if (!meId || !otherId) return;

      const isThisConversation =
        (String(msg.senderId) === String(meId) && String(msg.receiverId) === String(otherId)) ||
        (String(msg.senderId) === String(otherId) && String(msg.receiverId) === String(meId));

      if (isThisConversation) {
        dmMessages.value = [...dmMessages.value, msg];
      }
    });

    socket.__dmListenersReady = true;
  }

  return socket;
}

function leaveActiveDmRoom() {
  const socket = getSocket();
  if (!socket) return;
  if (!activeDmRoom.value) return;

  socket.emit("leave_room", { room: activeDmRoom.value }, () => {
    // ack opcional
  });
  activeDmRoom.value = null;
}

/**
 * Obre conversa DM amb un usuari:
 * 1) leave de la room anterior
 * 2) GET historial
 * 3) connect socket + join room
 */
async function loadDmConversation(receiverId) {
  dmLoading.value = true;
  dmError.value = "";

  try {
    // 0) sortim de room anterior si existia
    leaveActiveDmRoom();

    // 1) Historial via HTTP
    dmMessages.value = await getDmMessages(receiverId, 50);

    // 2) Socket realtime
    const socket = ensureSocketAndListeners();
    const meId = currentUser.value?.id;
    if (!meId) throw new Error("Missing current user id");

    const room = buildDmRoom(meId, receiverId);
    activeDmRoom.value = room;

    // join_room verifica permisos al backend (DM: només els dos usuaris)
    socket.emit("join_room", { room }, (ack) => {
      if (ack && ack.ok === false) {
        console.warn("⚠️ join_room failed:", ack.error);
      }
    });
  } catch (e) {
    dmError.value = e.message || "Error carregant missatges";
    console.error("❌ Error loading DM conversation:", dmError.value);
  } finally {
    dmLoading.value = false;
  }
}

/**
 * Envia un missatge DM.
 *
 * Aquest mètode és cridat quan RightChatDrawer emet @send-message.
 */
function sendDmMessage(text) {
  try {
    const receiverId = selectedChatId.value;
    if (!receiverId) return;

    const socket = ensureSocketAndListeners();

    socket.emit(
      "send_message",
      {
        contextType: "dm",
        receiverId,
        text,
      },
      (ack) => {
        if (ack && ack.ok === false) {
          console.warn("❌ send_message failed:", ack.error);
        }
        // Nota important:
        // - NO afegim el missatge aquí a dmMessages.
        // - El backend emet "new_message" a la room i el listener ja l'afegeix.
        // Així evitem duplicats.
      },
    );
  } catch (e) {
    console.error("❌ Error sending DM:", e.message);
  }
}

/**
 * Carrega dades reals del backend
 */
async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    console.log("📡 Fetching classes and groups from API...");
    const [classesData, groupsData] = await Promise.all([
      getClasses(),
      getGroups().catch((err) => {
        console.warn("⚠️ Groups fetch failed (might be normal for professors):", err.message);
        return [];
      })
    ]);
    console.log("✅ Classes loaded:", classesData);
    console.log("✅ Groups loaded:", groupsData);
    classes.value = classesData;
    groups.value = groupsData;
  } catch (e) {
    error.value = e.message || "Error al caregar dades";
    console.error("❌ Error loading data:", error.value);
  } finally {
    loading.value = false;
  }
}

// Carrega dades al muntar i quan tornem a la pàgina (refresh)
onMounted(async () => {
  try {
    const me = await apiRequest("/me");
    role.value = me.role;
    currentUser.value = me;
  } catch (e) {
    localStorage.removeItem("accessToken");
    router.push("/auth/login");
    return;
  }

  // Carreguem dades principals + usuaris del DM en paral·lel
  await Promise.all([loadData(), loadDmUsers()]);
});


onActivated(() => {
  // Refrescar quando tornem a aquesta pàgina (ex: després de crear classe)
  loadData();
});
</script>