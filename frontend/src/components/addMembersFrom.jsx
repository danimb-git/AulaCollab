import React, { useState } from "react";
import { addMembersByEmail } from "../services/classes.service";

function parseEmails(text) {
  return text
    .split(/[\n,; ]+/)          // separa per comes, espais, salts de línia, ;
    .map((e) => e.trim())
    .filter(Boolean);
}

export default function AddMembersForm({ classId }) {
  const [emailsText, setEmailsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    const emails = parseEmails(emailsText);

    if (emails.length === 0) {
      setError("Escriu almenys un email.");
      return;
    }

    try {
      setLoading(true);
      const data = await addMembersByEmail(classId, emails);
      setResult(data);
    } catch (e2) {
      setError(e2.message || "Error afegint membres");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <textarea
          rows={4}
          placeholder="Ex: anna@gmail.com, pau@hotmail.com"
          value={emailsText}
          onChange={(e) => setEmailsText(e.target.value)}
          style={{ width: "100%", maxWidth: 520 }}
        />
        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Afegint..." : "Afegir"}
          </button>
        </div>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 12 }}>
          <ResultBlock title="✅ Afegits" items={result.added || []} />
          <ResultBlock title="ℹ️ Ja eren membres" items={result.alreadyMembers || []} />
          <ResultBlock title="⚠️ No trobats" items={result.notFound || []} />
        </div>
      )}
    </div>
  );
}

function ResultBlock({ title, items }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <b>{title}</b>
      {items.length === 0 ? (
        <div style={{ opacity: 0.7 }}>—</div>
      ) : (
        <ul>
          {items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
