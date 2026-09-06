const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatDateID(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getDate()} ${INDONESIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${INDONESIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
