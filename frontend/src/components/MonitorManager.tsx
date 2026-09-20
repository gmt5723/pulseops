"use client";

import { useEffect, useState, type FormEvent } from "react";
import ResultCard from "@/components/ResultCard";
import type { CheckResult } from "@/types/monitor";
import DeleteMonitorButton from "@/components/DeleteMonitorButton";
import RenameMonitorForm from "@/components/RenameMonitorForm";

type Monitor = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
};

type MonitorCheck = {
  loading: boolean;
  result: CheckResult | null;
  error: string;
};

async function readResponse(response: Response) {
  const data = await response.json().catch(() => {
    throw new Error("Cannot read the API response. Check the backend.");
  });

  if (!response.ok) {
    throw new Error(data.message ?? "The request failed.");
  }

  return data;
}

type MonitorManagerProps = {
  onCheckComplete: (result: CheckResult) => void;
};

export default function MonitorManager({
  onCheckComplete,
}: MonitorManagerProps) {  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://example.com");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checks, setChecks] = useState<Record<string, MonitorCheck>>({});

  useEffect(() => {
    const controller = new AbortController();

    async function loadMonitors() {
      try {
        const response = await fetch("/api/monitors", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await readResponse(response);

        if (!controller.signal.aborted) {
          setMonitors(data.monitors);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error ? error.message : "Loading failed."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadMonitors();
    return () => controller.abort();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || loading) return;

    setError("");
    setNotice("");
    setSaving(true);

    try {
      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await readResponse(response);
      const monitor: Monitor = data.monitor;

      setMonitors((previous) => [...previous, monitor]);
      setName("");
      setNotice(`${monitor.name} created.`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Creation failed."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCheck(monitor: Monitor) {
    if (checks[monitor.id]?.loading) return;

    setChecks((previous) => ({
      ...previous,
      [monitor.id]: {
        loading: true,
        result: null,
        error: "",
      },
    }));

    try {
      const params = new URLSearchParams({ url: monitor.url });

      const response = await fetch(`/api/check?${params}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });

      const result: CheckResult = await readResponse(response);

      setChecks((previous) => ({
        ...previous,
        [monitor.id]: {
          loading: false,
          result,
          error: "",
        },
      }));
      onCheckComplete(result);
    } catch (error) {
      setChecks((previous) => ({
        ...previous,
        [monitor.id]: {
          loading: false,
          result: null,
          error:
            error instanceof Error
              ? error.message
              : "The check could not be completed.",
        },
      }));
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Named monitors</h2>

      <p className="mt-2 text-sm text-slate-400">
        Monitors are saved and remain after backend restarts.
        Check results clear when you refresh.
      </p>

      <form onSubmit={handleCreate} className="mt-5 space-y-4">
        <div>
          <label htmlFor="monitor-name" className="mb-2 block">
            Monitor name
          </label>
          <input
            id="monitor-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={60}
            disabled={saving || loading}
            placeholder="Example website"
            className="w-full rounded-lg border border-slate-600 bg-slate-950 p-3 focus:outline-2 focus:outline-lime-400"
          />
        </div>

        <div>
          <label htmlFor="monitor-url" className="mb-2 block">
            Monitor URL
          </label>
          <input
            id="monitor-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
            disabled={saving || loading}
            aria-describedby="monitor-help"
            className="w-full rounded-lg border border-slate-600 bg-slate-950 p-3 focus:outline-2 focus:outline-lime-400"
          />
          <p id="monitor-help" className="mt-2 text-sm text-slate-400">
            Supports https://example.com and https://example.org.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className="rounded-lg bg-lime-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-400"
        >
          {saving ? "Creating..." : "Create monitor"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-red-300">
          {error}
        </p>
      )}

      <p role="status" className="mt-4 text-lime-400">
        {notice}
      </p>

      {loading ? (
        <p className="mt-4 text-slate-400">Loading monitors...</p>
      ) : monitors.length === 0 ? (
        <p className="mt-4 text-slate-400">No monitors loaded.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-700">
          {monitors.map((monitor) => {
            const check = checks[monitor.id];

            return (
              <li key={monitor.id} className="space-y-4 py-5">
                <div>
                  <h3 className="font-semibold">{monitor.name}</h3>
                  <p className="break-words text-sm text-slate-400">
                    {monitor.url}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCheck(monitor)}
                  disabled={check?.loading ?? false}
                  aria-label={`Check ${monitor.name} now`}
                  className="rounded-lg bg-lime-400 px-4 py-2 font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-400"
                >
                  {check?.loading ? "Checking..." : "Check now"}
                </button>
<RenameMonitorForm
  monitorId={monitor.id}
  monitorName={monitor.name}
  disabled={check?.loading ?? false}
  onRenamed={(id, newName) => {
    setMonitors((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, name: newName } : item
      )
    );

    setNotice(`Monitor renamed to ${newName}.`);
  }}
/>
                <DeleteMonitorButton
  monitorId={monitor.id}
  monitorName={monitor.name}
  disabled={check?.loading ?? false}
  onDeleted={(id) => {
    setMonitors((previous) =>
      previous.filter((item) => item.id !== id)
    );

    setChecks((previous) => {
      const updated = { ...previous };
      delete updated[id];
      return updated;
    });

    setNotice(`${monitor.name} deleted.`);
  }}
/>
                <div role="status" aria-live="polite">
                  {check?.loading && (
                    <p className="text-sm text-slate-400">
                      Waiting for the check result...
                    </p>
                  )}

                  {check?.result && (
                    <ResultCard result={check.result} />
                  )}
                </div>

                {check?.error && (
                  <p role="alert" className="text-red-300">
                    {check.error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}