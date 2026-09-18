export type CheckResult = {
  url: string;
  status: "ONLINE" | "FAILED";
  httpStatus: number | null;
  responseTimeMs: number | null;
  error: string | null;
};

export type CheckHistoryItem = CheckResult & {
  id: string;
  checkedAt: string;
};