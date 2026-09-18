export type CheckResult = {
  url: string;
  status: "ONLINE" | "FAILED";
  httpStatus: number | null;
  responseTimeMs: number | null;
  error: string | null;
};