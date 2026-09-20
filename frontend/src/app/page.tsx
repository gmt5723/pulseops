"use client";

import { useEffect, useState, type FormEvent } from "react";
import ResultCard from "@/components/ResultCard";
import CheckHistory from "@/components/CheckHistory";
import type { CheckResult, CheckHistoryItem } from "@/types/monitor";
import MonitorManager from "@/components/MonitorManager";

function mergeHistory(
  current: CheckHistoryItem[],
  incoming: CheckHistoryItem[]
): CheckHistoryItem[] {
  const unique = new Map<string, CheckHistoryItem>();

  for (const check of [...current, ...incoming]) {
    unique.set(check.id, check);
  }

  return Array.from(unique.values())
    .sort(
      (a, b) =>
        Date.parse(b.checkedAt) - Date.parse(a.checkedAt)
    )
    .slice(0, 20);
}

export default function Home() {
  const [url, setUrl] = useState("https://example.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<CheckHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        const response = await fetch("/api/checks", {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10000),
          ]),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? "Could not load saved history.");
        }

        if (!Array.isArray(data.checks)) {
          throw new Error("The API returned an invalid history response.");
        }

        if (!controller.signal.aborted) {
          setHistory((previous) =>
            mergeHistory(previous, data.checks)
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : "Could not load saved history."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => controller.abort();
  }, []);

  function recordCheck(completedCheck: CheckHistoryItem) {
    setHistory((previous) =>
      mergeHistory(previous, [completedCheck])
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setResult(null);

    if (!url.trim()) {
      setError("Enter a website URL.");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({ url: url.trim() });

      const response = await fetch(`/api/check?${params}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json().catch(() => {
        throw new Error(
          "Could not read the API response. Check the backend terminal."
        );
      });

      if (!response.ok) {
        throw new Error(data.message ?? "The check request failed.");
      }

      const completedCheck: CheckHistoryItem = data;

      setResult(completedCheck);
      recordCheck(completedCheck);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-sm font-semibold tracking-widest text-lime-400">
          PULSEOPS / WORKSPACE
        </p>

        <h1 className="text-4xl font-bold">Website monitor</h1>

        <p className="mt-3 text-slate-400">
          Check an endpoint and inspect its latest response.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="website-url"
              className="mb-2 block font-medium"
            >
              Website URL
            </label>

            <input
              id="website-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={loading}
              aria-describedby="url-help"
              className="w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white focus:outline-2 focus:outline-lime-400 disabled:opacity-60"
            />

            <p id="url-help" className="mt-3 text-sm text-slate-400">
              Supports https://example.com and https://example.org.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 rounded-lg bg-lime-400 px-5 py-3 font-bold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-400 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Checking..." : "Check website"}
            </button>
          </form>

          {error && (
            <p role="alert" className="mt-6 break-words text-red-300">
              {error}
            </p>
          )}

          <div role="status" aria-live="polite" className="mt-6">
            {loading && (
              <p className="text-slate-400">Waiting for a response...</p>
            )}

            {result && <ResultCard result={result} />}

            {!loading && !result && !error && (
              <p className="text-slate-400">No checks yet.</p>
            )}
          </div>
        </section>

        <MonitorManager onCheckComplete={recordCheck} />

        {historyLoading && (
          <p role="status" className="mt-6 text-slate-400">
            Loading saved history...
          </p>
        )}

        {historyError && (
          <p role="alert" className="mt-6 text-red-300">
            Could not load saved history: {historyError}
            {" "}Refresh the page to retry.
          </p>
        )}

        {history.length > 0 ||
        (!historyLoading && !historyError) ? (
          <CheckHistory checks={history} />
        ) : null}

        <p className="mt-4 text-sm text-slate-500">
          Manual checks | 5-second backend timeout | Last 20 checks saved
        </p>
      </div>
    </main>
  );
}