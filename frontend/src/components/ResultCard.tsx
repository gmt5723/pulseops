import type { CheckResult } from "@/types/monitor";

type ResultCardProps = {
  result: CheckResult;
};

export default function ResultCard({ result }: ResultCardProps) {
  return (
    <div className="space-y-2 border-t border-slate-700 pt-5">
      <p className="break-words text-slate-300">{result.url}</p>

      <p
        className={
          result.status === "ONLINE" ? "text-lime-400" : "text-red-300"
        }
      >
        Status: {result.status}
      </p>

      <p>HTTP status: {result.httpStatus ?? "No response"}</p>

      <p>
        Response time:{" "}
        {result.responseTimeMs === null
          ? "Not available"
          : `${result.responseTimeMs} ms`}
      </p>

      <p>Error: {result.error ?? "None"}</p>
    </div>
  );
}