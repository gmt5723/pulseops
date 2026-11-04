"use client";

import { useState } from "react";
import type { CheckHistoryItem } from "@/types/monitor";

type CheckHistoryProps = {
  checks: CheckHistoryItem[];
};

type HistoryFilter = "ALL" | "ONLINE" | "FAILED";

const filters: { value: HistoryFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ONLINE", label: "Online" },
  { value: "FAILED", label: "Failed" },
];

export default function CheckHistory({ checks }: CheckHistoryProps) {
  const [filter, setFilter] = useState<HistoryFilter>("ALL");

  const visibleChecks = checks.filter(
    (check) => filter === "ALL" || check.status === filter,
  );

  const counts = {
    ALL: checks.length,
    ONLINE: checks.filter((check) => check.status === "ONLINE").length,
    FAILED: checks.filter((check) => check.status === "FAILED").length,
  };

  return (
    <section
      aria-labelledby="history-heading"
      className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6"
    >
      <h2 id="history-heading" className="text-xl font-semibold">
        Recent checks
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Last 20 completed checks, newest first. History remains after page
        refreshes and backend restarts.
      </p>

      <div
        role="group"
        aria-label="Filter check history by status"
        className="mt-5 flex flex-wrap gap-2"
      >
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-400 ${
              filter === option.value
                ? "border-lime-400 bg-lime-400 text-slate-950"
                : "border-slate-600 text-slate-200 hover:bg-slate-800"
            }`}
          >
            {option.label} ({counts[option.value]})
          </button>
        ))}
      </div>

      <p role="status" className="mt-3 text-sm text-slate-400">
        Showing {visibleChecks.length} of {checks.length} saved checks.
      </p>

      {checks.length === 0 ? (
        <p className="mt-5 text-slate-400">No completed checks yet.</p>
      ) : visibleChecks.length === 0 ? (
        <p className="mt-5 text-slate-400">
          {`No ${filter === "FAILED" ? "failed" : "online"} checks in the saved history.`}
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-700">
          {visibleChecks.map((check) => (
            <li key={check.id} className="space-y-2 py-4">
              <p className="break-words font-medium">{check.url}</p>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span
                  className={
                    check.status === "ONLINE"
                      ? "text-lime-400"
                      : "text-red-300"
                  }
                >
                  {check.status}
                </span>

                <span>HTTP: {check.httpStatus ?? "No response"}</span>

                <span>
                  {check.responseTimeMs === null
                    ? "Response time unavailable"
                    : `${check.responseTimeMs} ms`}
                </span>

                <time
                  dateTime={check.checkedAt}
                  className="text-slate-400"
                >
                  {new Date(check.checkedAt).toLocaleString()}
                </time>
              </div>

              {check.error && (
                <p className="break-words text-sm text-red-300">
                  {check.error}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}