<template>
  <!-- TOP BAR -->
  <TopBar @logout="handleLogout" />

  <main class="page">
    <!-- TÍTOL -->
    <h1 class="pageTitle">
      {{ isOwner ? `GRUP ${groupData?.nom || "..."} - VISTA DE PROPIETARI` : `GRUP ${groupData?.nom || "..."}` }}
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
          Afegir un company (+)
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

      <!-- Només propietari: botó per penjar fitxer -->
      <div class="filesFooter">
        <PrimaryButton
          v-if="isOwner"
          class="btnSmall"
          type="button"
          @click="handleUploadFile"
        >
          Penjar un nou fitxer (+)
        </PrimaryButton>
      </div>
    </section>

    <!-- TORNAR -->
    <section style="text-align: center; margin-top: 40px; margin-bottom: 20px">
      <button class="auth-link" type="button" @click="goBack">
        ← Tornar al llistat
      </button>
    </section>
  </main>

  <!-- hidden file input -->
  <input ref="fileInput" type="file" style="display:none" @change="onFileSelected" />

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
  <AppModal v-if="showChatModal" @close="showChatModal = false">
    <div class="chatModal">
      <div class="chatMessages">
        <div
          v-for="m in groupMessages"
          :key="m.id"
          class="chatMsg"
        >
          <strong>{{ m.user }}:</strong> {{ m.text }}
        </div>
      </div>

      <div class="chatInputRow">
        <input
          class="chatInput"
          type="text"
          v-model="newMessage"
          placeholder="Escriu un missatge..."
          @keyup.enter="sendMessage"
        />
        <button class="chatSendBtn" type="button" @click="sendMessage">→</button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getGroupById, addMemberToGroup, getCurrentUser, getGroupDocuments, uploadGroupDocument } from "../../services/api";

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
const members = ref([]);
const files = ref([]);
const fileInput = ref(null);
const loading = ref(true);
const error = ref("");

/* =========================================================
   B) MODALS & UI STATE
   ========================================================= */

const showMembersModal = ref(false);
const showAddMemberModal = ref(false);
const showChatModal = ref(false);

const isOwner = computed(() => {
  if (!groupData.value) return false;
  const user = getCurrentUser();
  if (!user) return false;
  return groupData.value.owner_id === user.sub;
});

function handleLogout() {
  localStorage.removeItem("accessToken");
  router.push("/auth/login");
}

/**
 * Carrega els detalls del grup des del backend
 */
async function loadGroupDetail() {
  loading.value = true;
  error.value = "";
  try {
    console.log("📡 Fetching group details for ID:", groupId.value);
    const data = await getGroupById(groupId.value);
    groupData.value = data;
    console.log("✅ Group data loaded:", data);

    // Parse members from backend
    let membersList = [];
    if (data.group_members && Array.isArray(data.group_members)) {
      membersList = data.group_members.map((m) => ({
        id: m.user_id || m.users?.id || Date.now(),
        name: m.users?.nom 
          ? `${m.users.nom} ${m.users.cognom || ""}`.trim() 
          : m.users?.email || "Unknown",
        email: m.users?.email,
        owner: m.member_role === "OWNER"
      }));
    }
    members.value = membersList;
  } catch (e) {
    error.value = e.message || "Error al caregar el grup";
    console.error("❌ Error loading group:", error.value);
  } finally {
    loading.value = false;
  }
  
  // Load documents
  try { await loadGroupDocuments(); } catch (_) {}
}

async function loadGroupDocuments() {
  try {
    const docs = await getGroupDocuments(groupId.value);
    files.value = Array.isArray(docs) ? docs : [];
  } catch (e) {
    console.warn("Could not load group documents", e);
    files.value = [];
  }
}
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

function openMembersList() {
  loadGroupDetail();
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
  console.log("📝 Adding member:", newMemberEmail.value);
  addMemberByEmail(newMemberEmail.value.trim());
  closeAddMember();
}

function removeMember(memberId) {
  console.log("Treure membre:", memberId);
  members.value = members.value.filter((m) => m.id !== memberId);
}

/* =========================================================
   D) FITXERS
   ========================================================= */

function downloadFile(file) {
  if (!file || !file.id) return;
  window.open(`${window.location.protocol}//${window.location.hostname}:3000/api/groups/${groupId.value}/documents/${file.id}/download`,'_blank');
}

function handleUploadFile() {
  fileInput.value && fileInput.value.click();
}

async function onFileSelected(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  try {
    await uploadGroupDocument(groupId.value, f);
    await loadGroupDocuments();
    alert('Fitxer pujat correctament');
  } catch (err) {
    console.error('Upload failed', err);
    alert('Error al pujar el fitxer: ' + (err.message || 'Error'));
  } finally {
    e.target.value = null;
  }
}

/* =========================================================
   E) CHAT
   ========================================================= */

const groupMessages = ref([
  { id: 1, user: "Usuari 1", text: "Hola grup!" },
]);

const newMessage = ref("");

function openGroupChat() {
  showChatModal.value = true;
}

function sendMessage() {
  const text = newMessage.value.trim();
  if (!text) return;

  groupMessages.value.push({
    id: Date.now(),
    user: "Jo",
    text,
  });

  newMessage.value = "";
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

onMounted(() => {
  loadGroupDetail();
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

.filesList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fileRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  cursor: pointer;
}

.fileRow:hover {
  background: #f0f0f0;
}

.fileName {
  font-weight: 500;
  flex: 1;
}

.fileDate {
  color: #999;
  font-size: 0.9rem;
}

.filesFooter {
  margin-top: 15px;
  text-align: right;
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
