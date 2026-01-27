import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getClassDetail } from "../services/classes.service";
import AddMembersForm from "../components/AddMembersForm";
import { getUser } from "../auth/authStore";

export default function ClassDetail() {
  const { id } = useParams();
  const classId = Number(id);

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const role = useMemo(() => {
    // 1) del backend
    if (classData?.role) return classData.role;
    // 2) del user local
    const user = getUser();
    if (user?.role) return user.role;
    // 3) fallback segur
    return "ALUMNE";
  }, [classData]);

  if (loading) return <div>Carregant classe...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!classData) return <div>No s’ha trobat la classe.</div>;

  // Ajusta aquestes claus segons el que et retorni el backend:
  const className = classData.name || classData.class?.name || `Classe ${classId}`;
  const members = classData.members || classData.class?.members || [];

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
            </li>
          ))}
        </ul>
      )}

      {/* Només PROFESSOR veu el formulari */}
      {role === "PROFESSOR" ? (
        <>
          <h3>Afegir membres per email</h3>
          <AddMembersForm classId={classId} />
        </>
      ) : (
        <p style={{ opacity: 0.8 }}>
          (Només el professor pot afegir membres)
        </p>
      )}
    </div>
  );
}
