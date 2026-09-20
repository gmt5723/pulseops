import type { CheckHistoryItem } from "@/types/monitor";

type CheckHistoryProps = {
  checks: CheckHistoryItem[];
};

export default function CheckHistory({ checks }: CheckHistoryProps) {
  return (
    <section
      aria-labelledby="history-heading"
      className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6"
    >
      <h2 id="history-heading" className="text-xl font-semibold">
        Recent checks
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Last 20 completed checks, newest first.
History remains after page refreshes and backend restarts.
      </p>

      {checks.length === 0 ? (
        <p className="mt-5 text-slate-400">No completed checks yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-700">
          {checks.map((check) => (
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

                <time dateTime={check.checkedAt} className="text-slate-400">
                  {new Date(check.checkedAt).toLocaleString()}
                </time>
              </div>

              {check.error && (
                <p className="text-sm text-red-300">{check.error}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}