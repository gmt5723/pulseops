"use client";

import { useState } from "react";

type Props = {
  monitorId: string;
  monitorName: string;
  disabled?: boolean;
  onDeleted: (id: string) => void;
};

export default function DeleteMonitorButton({
  monitorId,
  monitorName,
  disabled = false,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (deleting || disabled) return;

    if (!window.confirm(`Delete "${monitorName}"?`)) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/monitors/${encodeURIComponent(monitorId)}`,
        {
          method: "DELETE",
          signal: AbortSignal.timeout(10000),
        }
      );

      const data = await response.json().catch(() => {
        throw new Error("Cannot read the API response.");
      });

      if (!response.ok) {
        throw new Error(data.message ?? "Could not delete the monitor.");
      }

      onDeleted(monitorId);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Deletion failed."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={disabled || deleting}
        aria-label={`Delete ${monitorName}`}
        className="rounded-lg border border-red-400 px-4 py-2 font-semibold text-red-300 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}