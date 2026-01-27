import { apiFetch } from "../../api/apiClient";

/**
 * GET /api/classes
 * Retorna llista de classes on l'usuari participa
 */
export function getClasses() {
  return apiFetch("/api/classes")
}

/**
 * GET /api/classes/:id
 * Retorna detall d'una classe + membres + (si el backend ho inclou) rol de l'usuari
 */
export function getClassDetail(id) {
  return apiFetch(`/api/classes/${id}`)
}

/**
 * POST /api/classes/:id/members
 * Body: { emails: ["a@a.com", "b@b.com"] }
 * Retorna: { added: [], alreadyMembers: [], notFound: [] } (o similar)
 */
export function addMembersByEmail(classId, emails) {
  return apiFetch(`/api/classes/${classId}/members`, {
    method: "POST",
    body: JSON.stringify({ emails }),
  });
}
