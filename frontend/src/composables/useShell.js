import { ref } from "vue";

export const leftMenuOpen = ref(false);
export const chatMenuOpen = ref(false);
export const profileMenuOpen = ref(false);

export function toggleLeft() {
  leftMenuOpen.value = !leftMenuOpen.value;
}

export function toggleChat() {
  chatMenuOpen.value = !chatMenuOpen.value;
}

export function toggleProfile() {
  profileMenuOpen.value = !profileMenuOpen.value;
}

export function closeAll() {
  leftMenuOpen.value = false;
  chatMenuOpen.value = false;
  profileMenuOpen.value = false;
}

export default {
  leftMenuOpen,
  chatMenuOpen,
  profileMenuOpen,
  toggleLeft,
  toggleChat,
  toggleProfile,
  closeAll,
};
