import { io } from "socket.io-client";

/**
 * socket.js
 *
 * Petit "singleton" per mantenir UNA sola connexió Socket.IO per tot el frontend.
 *
 * Per què ho fem així?
 * - Si crees un socket nou cada vegada que obres un xat, acabes amb múltiples connexions,
 *   listeners duplicats i missatges repetits.
 * - Amb un singleton: connectem 1 cop i reutilitzem.
 *
 * Important:
 * - El backend (backend/src/socket/index.js) espera el token a:
 *     socket.handshake.auth.token
 *   així que nosaltres el passem a `auth`.
 */

const SOCKET_URL = "http://localhost:3000";

let socket = null;

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

/**
 * Retorna un socket connectat (o el crea si no existeix).
 *
 * Nota:
 * - Si no hi ha token, NO connectem (evitem errors d'autenticació).
 * - Si canvia el token (re-login), el més net és fer `disconnectSocket()` i tornar a crear.
 */
export function getSocket() {
  const token = getAccessToken();
  if (!token) return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: {
        token,
      },
    });
  }

  return socket;
}

/**
 * Desconnecta i neteja el singleton.
 * (Útil per logout o quan vols reiniciar la connexió.)
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Construeix el nom de la "room" per un DM.
 *
 * IMPORTANT: ha de ser EXACTAMENT igual que el backend.
 * Backend: dmRoom(userA, userB) fa sort() i crea `dm:${a}:${b}`
 */
export function buildDmRoom(userA, userB) {
  const [a, b] = [String(userA), String(userB)].sort();
  return `dm:${a}:${b}`;
}
