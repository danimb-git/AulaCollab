import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getClassDetail,
  removeMember,
  leaveClass,
} from "../services/classes.service";
import AddMembersForm from "../components/addMembersFrom";
import { getUser } from "../auth/authStore";

export default function ClassDetail() {
  const { id } = useParams();
  const classId = id;

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [removingUserId, setRemovingUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await getClassDetail(classId);
        if (!cancelled) setClassData(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Error carregant detall");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => (cancelled = true);
  }, [classId]);

  const user = getUser();

  const role = useMemo(() => {
    if (user?.rol) return user.rol;
    return "ALUMNE";
  }, [user]);

  const isOwner = useMemo(() => {
    if (!classData || !user) return false;
    return classData.owner && classData.owner.id === user.id;
  }, [classData, user]);

  async function handleRemoveMember(userId) {
    try {
      setRemovingUserId(userId);
      await removeMember(classId, userId);
      // Refresquem membres un cop eliminat
      const updated = await getClassDetail(classId);
      setClassData(updated);
    } catch (e) {
      setError(e.message || "Error eliminant membre");
    } finally {
      setRemovingUserId(null);
    }
  }

  async function handleLeaveClass() {
    try {
      setLeaving(true);
      await leaveClass(classId);
      // Podríem redirigir a /classes; per simplicitat, només marquem missatge
      setError("Has abandonat la classe. Torna al llistat de classes.");
    } catch (e) {
      setError(e.message || "Error abandonant la classe");
    } finally {
      setLeaving(false);
    }
  }

  if (loading) return <div>Carregant classe...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!classData) return <div>No s’ha trobat la classe.</div>;

  const className = classData.name || `Classe ${classId}`;
  const members = classData.members || [];

  return (
    <div style={{ padding: 16 }}>
      <Link to="/classes">← Tornar</Link>

      <h2 style={{ marginTop: 12 }}>{className}</h2>
      <p>El teu rol: <b>{role}</b></p>

      <h3>Membres</h3>
      {members.length === 0 ? (
        <p>Encara no hi ha membres.</p>
      ) : (
        <ul>
          {members.map((m) => (
            <li key={m.id}>
              {m.name || m.email || `Usuari ${m.id}`}{" "}
              {m.role ? `(${m.role})` : ""}
              {isOwner && m.id !== user?.id && (
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => handleRemoveMember(m.id)}
                  disabled={removingUserId === m.id}
                >
                  {removingUserId === m.id ? "Eliminant..." : "Eliminar"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Només PROFESSOR (owner) veu el formulari d'afegir membres */}
      {role === "PROFESSOR" && isOwner ? (
        <>
          <h3>Afegir membres per email</h3>
          <AddMembersForm classId={classId} />
        </>
      ) : (
        <p style={{ opacity: 0.8 }}>
          (Només el professor pot afegir membres)
        </p>
      )}

      {/* Qualsevol membre no-owner pot abandonar la classe (el backend aplica les regles reals) */}
      {user && !isOwner && (
        <div style={{ marginTop: 16 }}>
          <button onClick={handleLeaveClass} disabled={leaving}>
            {leaving ? "Sortint..." : "Abandonar classe"}
          </button>
        </div>
      )}
    </div>
  );
}
