image.pngimport React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createClass } from "../services/classes.service";
import { getUser } from "../auth/authStore";

export default function CreateClassPage() {
  const navigate = useNavigate();
  const [nom, setNom] = useState("");
  const [descripcio, setDescripcio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = getUser();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!nom.trim()) {
      setError("El nom de la classe és obligatori.");
      return;
    }

    try {
      setLoading(true);
      const newClass = await createClass({ nom: nom.trim(), descripcio });
      // Redirigim al detall de la nova classe
      navigate(`/classes/${newClass.id}`);
    } catch (e2) {
      setError(e2.message || "Error creant classe");
    } finally {
      setLoading(false);
    }
  }

  // No fem enforcement fort al front, el backend valida rol.
  if (!user || user.rol !== "PROFESSOR") {
    return (
      <div style={{ padding: 16 }}>
        <Link to="/classes">← Tornar</Link>
        <p style={{ marginTop: 12 }}>
          Només els professors poden crear classes.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Link to="/classes">← Tornar</Link>
      <h2 style={{ marginTop: 12 }}>Crear nova classe</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Nom de la classe
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 4 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Descripció (opcional)
            <textarea
              rows={3}
              value={descripcio}
              onChange={(e) => setDescripcio(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 4 }}
            />
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creant..." : "Crear classe"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
    </div>
  );
}


