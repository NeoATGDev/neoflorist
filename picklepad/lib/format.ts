export function rupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function prettyDate(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function dayLabel(d: Date, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { weekday: "short" });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /[a-z]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
