/** Central Time — CST/CDT as observed in Iowa (UTC−6 / UTC−5). */
export const APP_TIME_ZONE = "America/Chicago";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  dateStyle: "short",
  timeStyle: "medium",
});

const stampFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZoneName: "shortOffset",
});

export function formatDateTime(value: Date | string | number) {
  return dateTimeFormatter.format(new Date(value));
}

/** Snapshot stamp for backups, e.g. 09/07/2026, 15:30:00 GMT-5 */
export function formatCentralStamp(value: Date | string | number = new Date()) {
  return stampFormatter.format(new Date(value));
}

/** Safe filename fragment from Central Time, e.g. 2026-09-07T15-30-00 */
export function centralFileStamp(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}-${get("minute")}-${get("second")}`;
}
