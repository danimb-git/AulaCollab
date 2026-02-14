<template>
  <!-- TOP BAR -->
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
      {{ groupData?.nom || "Grup de treball" }}
    </h1>

    <!-- BANNER BOTONS -->
    <section class="wideBanner">
      <div class="wideBannerInner">
        <PrimaryButton class="btnGhost" type="button" @click="openMembersList">
          Veure membres
        </PrimaryButton>

        <PrimaryButton
          v-if="isOwner"
          class="btnGhost"
          type="button"
          @click="openAddMember"
        >
          Afegir un membre (+)
        </PrimaryButton>
      </div>
    </section>

    <!-- DESCRIPCIÓ -->
    <section class="classDescription">
      <h2 class="subtitle">Descripció</h2>
      <p class="descText">
        {{ groupData?.descripcio || "No hi ha descripció" }}
      </p>
    </section>

    <!-- BOTONS CHAT + VIDEO -->
    <section class="twoButtonsRow">
      <button class="bigActionBtn" type="button" @click="openGroupChat">
        <span class="circleIcon"></span>
        <span>Chat del grup</span>
      </button>

      <button class="bigActionBtn" type="button" @click="handleVideoCall">
        <span class="circleIcon"></span>
        <span>Videotrucada</span>
      </button>
    </section>

    <!-- FITXERS -->
    <section class="filesSection">
      <div class="sectionTitle">
        <h3>Fitxers compartits</h3>
        <button type="button" class="uploadBtn" @click="handleUploadFile">
          📎 Pujar fitxer
        </button>
      </div>

      <div class="filesList">
        <div v-for="f in files" :key="f.id" class="fileItem">
          <span>{{ f.name }}</span>
          <span class="fileDate">{{ f.date }}</span>
          <button
            type="button"
            class="downloadBtn"
            @click="downloadFile(f)"
          >
            ⬇️
          </button>
        </div>
      </div>
    </section>

    <!-- TORNAR -->
    <section style="text-align: center; margin-top: 40px; margin-bottom: 20px">
      <button class="auth-link" type="button" @click="goBack">
        ← Tornar al llistat
      </button>
    </section>
  </main>

  <!-- MODAL: MEMBRES -->
  <AppModal v-if="showMembersModal" @close="closeMembersModal">
    <div class="membersModal">
      <h3 class="modalTitle">Membres del grup</h3>

      <div class="membersList">
        <div v-for="m in members" :key="m.id" class="memberItem">
          {{ m.name }}
          <span v-if="m.owner" class="ownerBadge">owner</span>
          <button
            v-if="isOwner && !m.owner"
            type="button"
            class="removeMemberBtn"
            @click="removeMember(m.id)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </AppModal>

  <!-- MODAL: AFEGIR MEMBRE -->
  <AppModal v-if="showAddMemberModal" @close="closeAddMember">
    <div class="addMemberModal">
      <h3 class="modalTitle">Afegir company per email</h3>

      <FormField
        label="Correu electrònic"
        v-model="newMemberEmail"
        placeholder="company@exemple.com"
      />

      <div class="modalActions">
        <PrimaryButton class="btnSmall" type="button" @click="submitAddMember">
          Afegir
        </PrimaryButton>
      </div>
    </div>
  </AppModal>

  <!-- MODAL: CHAT DEL GRUP -->
  <AppModal v-if="showChatModal" @close="closeGroupChat">
    <div class="chatModal">
      <div class="chatMessages">
        <div v-if="chatError" class="chatMsg" style="color: red;">
          ⚠️ {{ chatError }}
        </div>

        <div v-else-if="chatLoading" class="chatMsg" style="opacity: 0.7;">
          Carregant historial...
        </div>

        <div
          v-for="m in groupMessages"
          :key="m.id"
          class="chatMsg"
        >
          <strong>{{ displaySender(m) }}:</strong> {{ m.text }}
        </div>

        <div
          v-if="!chatLoading && !chatError && groupMessages.length === 0"
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
          @keyup.enter="sendGroupMessage"
        />
        <button class="chatSendBtn" type="button" @click="sendGroupMessage">→</button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  apiRequest,
  getGroupById,
  addMemberToGroup,
  getCurrentUser,
  getGroupMessages,
} from "../../services/api";

import { getSocket } from "../../services/socket";

import TopBar from "../../components/app/TopBar.vue";
import AppModal from "../../components/ui/AppModal.vue";
import FormField from "../../components/ui/FormField.vue";
import PrimaryButton from "../../components/ui/PrimaryButton.vue";

const route = useRoute();
const router = useRouter();

/* =========================================================
   A) ESTAT (real data)
   ========================================================= */

const groupId = computed(() => route.params.id);
const groupData = ref(null);
const loading = ref(true);
const error = ref("");

// Usuari actual (via /api/me) per poder identificar "Jo" al chat.
const me = ref(null);

/* =========================================================
   B) TOPBAR
   ========================================================= */

const showProfileDropdown = ref(false);

function toggleLeft() {
  console.log("toggle left drawer");
}

function toggleRight() {
  console.log("toggle right drawer");
}

function toggleProfile() {
  showProfileDropdown.value = !showProfileDropdown.value;
}

function handleLogout() {
  localStorage.removeItem("accessToken");
  router.push("/auth/login");
}

/* =========================================================
   C) MEMBRES & MODALS
   ========================================================= */

const showMembersModal = ref(false);
const showAddMemberModal = ref(false);
const showChatModal = ref(false);

const isOwner = computed(() => {
  if (!groupData.value) return false;
  const user = getCurrentUser();
  if (!user) return false;
  // Verificar si és el propietari
  return groupData.value.owner_id === user.sub;
});

const members = ref([]);

function openMembersList() {
  console.log("📋 Showing members modal. Current members:", members.value);
  showMembersModal.value = true;
}

function closeMembersModal() {
  showMembersModal.value = false;
}

const newMemberEmail = ref("");

function openAddMember() {
  showAddMemberModal.value = true;
}

function closeAddMember() {
  showAddMemberModal.value = false;
  newMemberEmail.value = "";
}

function submitAddMember() {
  if (!newMemberEmail.value.trim()) return;

  // Afegir membre al grup via API
  console.log("📝 Adding member:", newMemberEmail.value);
  addMemberByEmail(newMemberEmail.value.trim());
  closeAddMember();
}

/**
 * Afegir company per email (connectat a backend)
 */
async function addMemberByEmail(email) {
  try {
    console.log("📤 Calling API to add member to group:", email);
    const result = await addMemberToGroup(groupId.value, [email]);
    console.log("✅ Member added to group successfully:", result);
    
    // Recarregar els membres del grup per assegurar que estan actualitzats
    console.log("🔄 Reloading group members...");
    await loadGroupDetail();
    console.log("✅ Group members refreshed");
  } catch (e) {
    console.error("❌ Error adding member to group:", e);
    alert("Error al afegir el company: " + (e.message || "Error desconegut"));
  }
}

function removeMember(memberId) {
  console.log("Treure membre:", memberId);
  members.value = members.value.filter((m) => m.id !== memberId);
}

/* =========================================================
   D) CHAT
   ========================================================= */

// Missatges reals del backend:
// { id, text, senderId, receiverId, contextType, contextId, createdAt }
const groupMessages = ref([]);
const newMessage = ref("");
const chatLoading = ref(false);
const chatError = ref("");

// Room activa del grup per poder fer leave quan tanquem modal.
const activeGroupRoom = ref(null);

function buildGroupRoom(id) {
  return `group:${id}`;
}

function requireSocket() {
  const socket = getSocket();
  if (!socket) throw new Error("No access token: cannot connect socket");
  return socket;
}

/**
 * Listener singleton per missatges de grup.
 * Guardem el flag a l'objecte socket per evitar duplicats.
 */
function ensureGroupChatListener() {
  const socket = requireSocket();

  if (!socket.__groupChatListenerReady) {
    socket.on("new_message", (msg) => {
      if (!msg || msg.contextType !== "group") return;
      if (String(msg.contextId) !== String(groupId.value)) return;
      groupMessages.value = [...groupMessages.value, msg];
    });

    socket.__groupChatListenerReady = true;
  }

  return socket;
}

function leaveGroupRoomIfNeeded() {
  const socket = getSocket();
  if (!socket) return;
  if (!activeGroupRoom.value) return;

  socket.emit("leave_room", { room: activeGroupRoom.value }, () => {
    // ack opcional
  });
  activeGroupRoom.value = null;
}

/**
 * Obrir el chat de grup (mateixa lògica que ClassPage):
 * 1) obrir modal
 * 2) carregar historial via HTTP
 * 3) connectar socket + join room group:<id>
 */
async function openGroupChat() {
  showChatModal.value = true;
  chatError.value = "";
  chatLoading.value = true;

  try {
    leaveGroupRoomIfNeeded();

    // Historial
    groupMessages.value = await getGroupMessages(groupId.value, 100);

    // Realtime
    const socket = ensureGroupChatListener();
    const room = buildGroupRoom(groupId.value);
    activeGroupRoom.value = room;

    socket.emit("join_room", { room }, (ack) => {
      if (ack && ack.ok === false) {
        console.warn("⚠️ join_room(group) failed:", ack.error);
      }
    });
  } catch (e) {
    chatError.value = e.message || "Error obrint el xat del grup";
    console.error("❌ openGroupChat error:", chatError.value);
  } finally {
    chatLoading.value = false;
  }
}

function closeGroupChat() {
  leaveGroupRoomIfNeeded();
  showChatModal.value = false;
  newMessage.value = "";
}

/**
 * Enviar missatge al grup via Socket.IO.
 * No fem push manual: esperem el `new_message` del backend.
 */
function sendGroupMessage() {
  const text = (newMessage.value || "").trim();
  if (!text) return;

  try {
    chatError.value = "";
    const socket = ensureGroupChatListener();

    socket.emit(
      "send_message",
      {
        contextType: "group",
        contextId: groupId.value,
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

function displaySender(m) {
  const myId = me.value?.id;
  if (myId && String(m.senderId) === String(myId)) return "Jo";

  const owner = groupData.value?.owner;
  if (owner && String(owner.id) === String(m.senderId)) {
    return [owner.nom, owner.cognom].filter(Boolean).join(" ") || owner.email;
  }

  const members = groupData.value?.group_members || [];
  const member = members.find((gm) => String(gm?.users?.id) === String(m.senderId));
  if (member?.users) {
    const u = member.users;
    return [u.nom, u.cognom].filter(Boolean).join(" ") || u.email;
  }

  const id = String(m.senderId || "");
  return id ? `Usuari ${id.slice(-6)}` : "Usuari";
}

/* =========================================================
   E) FITXERS
   ========================================================= */

const files = ref([
  { id: 1, name: "Fitxer 1", date: "01/01/2026" },
  { id: 2, name: "Fitxer 2", date: "02/01/2026" },
]);

function downloadFile(file) {
  console.log("Download:", file);
}

function handleUploadFile() {
  console.log("Upload file");
}

/* =========================================================
   F) VIDEOTRUCADA
   ========================================================= */

function handleVideoCall() {
  console.log("Videotrucada");
}

/* =========================================================
   G) NAVEGACIÓ
   ========================================================= */

function goBack() {
  router.push("/moodle");
}

/* =========================================================
   H) DATA LOADING
   ========================================================= */

async function loadGroupDetail() {
  loading.value = true;
  error.value = "";
  try {
    console.log("📡 Fetching group details for ID:", groupId.value);
    const data = await getGroupById(groupId.value);
    console.log("✅ Group data loaded:", data);
    groupData.value = data;
    
    // Actualitzar membres - intentem múltiples estructures possibles
    let membersList = [];
    
    // Intentar estructures possibles del backend
    if (data.group_members && Array.isArray(data.group_members)) {
      console.log("📋 Processing group_members array...");
      membersList = data.group_members.map((m) => {
        console.log("  Processing member:", m);
        return {
          id: m.user_id || m.users?.id || Date.now(),
          name: m.users?.nom 
            ? `${m.users.nom} ${m.users.cognom || ""}`.trim() 
            : m.users?.email || "Unknown",
          email: m.users?.email,
          owner: m.member_role === "OWNER",
        };
      });
    } else if (data.members && Array.isArray(data.members)) {
      console.log("📋 Processing members array...");
      membersList = data.members.map((m) => ({
        id: m.id || Date.now(),
        name: m.nom ? `${m.nom} ${m.cognom || ""}`.trim() : m.email || "Unknown",
        email: m.email,
        owner: m.is_owner || m.role === "OWNER",
      }));
    }
    
    if (membersList.length > 0) {
      members.value = membersList;
      console.log("✅ Members loaded:", members.value);
    } else {
      console.warn("⚠️ No members found in response");
      members.value = [];
    }
  } catch (e) {
    error.value = e.message || "Error al caregar grup";
    console.error("❌ Error loading group:", error.value);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadGroupDetail();

  // Carrega l'usuari actual per poder identificar "Jo" en el chat.
  apiRequest("/me")
    .then((data) => {
      me.value = data;
    })
    .catch(() => {
      me.value = null;
    });
});
</script>

<style scoped>
.page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.pageTitle {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 30px;
  color: #333;
}

.wideBanner {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.wideBannerInner {
  display: flex;
  gap: 10px;
}

.btnGhost {
  background: transparent;
  border: 1px solid #999;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.classDescription {
  margin-bottom: 30px;
}

.subtitle {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.descText {
  color: #666;
  line-height: 1.6;
}

.twoButtonsRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.bigActionBtn {
  background: #007bff;
  color: white;
  border: none;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: bold;
}

.bigActionBtn:hover {
  background: #0056b3;
}

.circleIcon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: inline-block;
}

.filesSection {
  margin-bottom: 30px;
}

.sectionTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.sectionTitle h3 {
  font-size: 1.2rem;
  font-weight: bold;
}

.uploadBtn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.filesList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fileItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
}

.fileDate {
  color: #999;
  font-size: 0.9rem;
}

.downloadBtn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

.auth-link {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
  font-size: 1rem;
}

/* MODALS */
.membersModal,
.addMemberModal,
.chatModal {
  padding: 20px;
  max-width: 500px;
}

.modalTitle {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 15px;
}

.membersList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.memberItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.ownerBadge {
  background: #ffc107;
  color: #000;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: bold;
}

.removeMemberBtn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9rem;
}

.modalActions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btnSmall {
  padding: 8px 16px;
  font-size: 0.9rem;
}

.chatModal {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 400px;
}

.chatMessages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.chatMsg {
  padding: 8px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.chatInputRow {
  display: flex;
  gap: 10px;
}

.chatInput {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.chatSendBtn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
</style>
