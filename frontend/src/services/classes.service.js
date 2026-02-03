import { apiFetch } from "../api/apiClient";

// Helper: desempaqueta { ok, data } del backend si cal
function unwrapData(response) {
  if (response && typeof response === "object" && "data" in response) {
    return response.data;
  }
  return response;
}

/**
 * GET /api/classes
 * Retorna la llista de classes segons el rol de l'usuari autenticat.
 */
export async function getClasses() {
  const res = await apiFetch("/api/classes");
  return unwrapData(res);
}

/**
 * GET /api/classes/:id
 * Retorna detall d'una classe + membres.
 * Transformem la resposta del backend a un format més còmode per al front.
 */
export async function getClassDetail(classId) {
  const res = await apiFetch(`/api/classes/${classId}`);
  const detail = unwrapData(res);

  if (!detail) return null;

  const owner = detail.users || null;
  const members =
    Array.isArray(detail.class_members) &&
    detail.class_members.map((cm) => ({
      id: cm.users?.id ?? cm.user_id,
      email: cm.users?.email ?? null,
      role: cm.users?.rol ?? null,
      name: cm.users
        ? `${cm.users.nom} ${cm.users.cognom}`.trim()
        : null,
    }));

  return {
    id: detail.id,
    name: detail.nom,
    description: detail.descripcio,
    owner,
    members: members || [],
  };
}

/**
 * POST /api/classes
 * Crea una nova classe (només PROFESSOR; el backend aplica permisos).
 */
export async function createClass({ nom, descripcio }) {
  const res = await apiFetch("/api/classes", {
    method: "POST",
    body: JSON.stringify({ nom, descripcio }),
  });
  return unwrapData(res);
}

/**
 * POST /api/classes/:id/members
 * Body: { emails: ["a@a.com", "b@b.com"] }
 * El backend retorna { ok, data: { added, alreadyMember, notFound, classId } }.
 */
export async function addMembersByEmail(classId, emails) {
  const res = await apiFetch(`/api/classes/${classId}/members`, {
    method: "POST",
    body: JSON.stringify({ emails }),
  });
  const data = unwrapData(res) || {};

  return {
    added: data.added || [],
    alreadyMembers: data.alreadyMember || [],
    notFound: data.notFound || [],
  };
}

/**
 * DELETE /api/classes/:id/members/:userId
 * El backend comprova permisos (només owner).
 */
export async function removeMember(classId, userId) {
  const res = await apiFetch(`/api/classes/${classId}/members/${userId}`, {
    method: "DELETE",
  });
  return unwrapData(res);
}

/**
 * POST /api/classes/:id/leave
 * Qualsevol membre pot abandonar la classe (excepte owner, el backend ho valida).
 */
export async function leaveClass(classId) {
  const res = await apiFetch(`/api/classes/${classId}/leave`, {
    method: "POST",
  });
  return unwrapData(res);
}
