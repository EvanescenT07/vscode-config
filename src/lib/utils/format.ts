export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

export function relativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();

  if (!Number.isFinite(timestamp)) {
    return "unknown";
  }

  const deltaSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absolute = Math.abs(deltaSeconds);

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absolute < 60) {
    return formatter.format(deltaSeconds, "second");
  }
  if (absolute < 3600) {
    return formatter.format(Math.round(deltaSeconds / 60), "minute");
  }
  if (absolute < 86_400) {
    return formatter.format(Math.round(deltaSeconds / 3600), "hour");
  }
  if (absolute < 2_592_000) {
    return formatter.format(Math.round(deltaSeconds / 86_400), "day");
  }
  if (absolute < 31_536_000) {
    return formatter.format(Math.round(deltaSeconds / 2_592_000), "month");
  }
  return formatter.format(Math.round(deltaSeconds / 31_536_000), "year");
}

export function exactUtc(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }
  return `${date.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

export function estimateTokensFromBytes(bytes: number): number {
  return Math.max(1, Math.ceil(bytes / 4));
}

export function copyLinePreview(value: string, limit = 90): string {
  return value.length > limit ? `${value.slice(0, limit - 3)}...` : value;
}
