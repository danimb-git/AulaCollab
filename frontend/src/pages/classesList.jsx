import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClasses } from "../services/classes.service";

export default function ClassesList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await getClasses();
        if (!cancelled) setClasses(data || []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Error carregant classes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => (cancelled = true);
  }, []);

  if (loading) return <div>Carregant classes...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Classes</h2>

      {classes.length === 0 ? (
        <p>Encara no formes part de cap classe.</p>
      ) : (
        <ul>
          {classes.map((c) => (
            <li key={c.id}>
              <Link to={`/classes/${c.id}`}>{c.name || `Classe ${c.id}`}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
