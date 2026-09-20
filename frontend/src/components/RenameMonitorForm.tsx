"use client";

import { useState, type FormEvent } from "react";

type Props = {
  monitorId: string;
  monitorName: string;
  disabled?: boolean;
  onRenamed: (id: string, name: string) => void;
};

export default function RenameMonitorForm({
  monitorId,
  monitorName,
  disabled = false,
  onRenamed,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(monitorName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEditing() {
    setName(monitorName);
    setError("");
    setEditing(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || disabled) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Enter a monitor name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/monitors/${encodeURIComponent(monitorId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
          signal: AbortSignal.timeout(10000),
        }
      );

      const data = await response.json().catch(() => {
        throw new Error("Cannot read the API response.");
      });

      if (!response.ok) {
        throw new Error(data.message ?? "Could not rename the monitor.");
      }

      onRenamed(monitorId, data.monitor.name);
      setEditing(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Renaming failed."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        disabled={disabled}
        aria-label={`Rename ${monitorName}`}
        className="rounded-lg border border-slate-500 px-4 py-2 font-semibold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-400"
      >
        Rename
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <label
        htmlFor={`rename-${monitorId}`}
        className="block text-sm font-medium"
      >
        New monitor name
      </label>

      <input
        id={`rename-${monitorId}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={60}
        disabled={saving || disabled}
        className="w-full rounded-lg border border-slate-600 bg-slate-950 p-3 focus:outline-2 focus:outline-lime-400"
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || disabled}
          className="rounded-lg bg-lime-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-400"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setEditing(false);
            setError("");
          }}
          className="rounded-lg border border-slate-500 px-4 py-2 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-400"
        >
          Cancel
        </button>
      </div>

      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}