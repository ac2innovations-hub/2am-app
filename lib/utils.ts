export function calcWeekFromDueDate(dueDate: string | Date): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const ms = due.getTime() - Date.now();
  const daysUntil = Math.floor(ms / (1000 * 60 * 60 * 24));
  const week = 40 - Math.round(daysUntil / 7);
  return Math.max(1, Math.min(42, week));
}

export function trimester(week: number): 1 | 2 | 3 {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
}

export function babySizeForWeek(week: number): string {
  const sizes: Record<number, string> = {
    4: "a poppyseed",
    5: "a sesame seed",
    6: "a lentil",
    7: "a blueberry",
    8: "a raspberry",
    9: "a cherry",
    10: "a strawberry",
    11: "a lime",
    12: "a plum",
    13: "a lemon",
    14: "a peach",
    15: "an apple",
    16: "an avocado",
    17: "a pomegranate",
    18: "a bell pepper",
    19: "a mango",
    20: "a banana",
    21: "a carrot",
    22: "a spaghetti squash",
    23: "a large mango",
    24: "an ear of corn",
    25: "a rutabaga",
    26: "a head of lettuce",
    27: "a cauliflower",
    28: "an eggplant",
    29: "a butternut squash",
    30: "a cabbage",
    31: "a coconut",
    32: "a jicama",
    33: "a pineapple",
    34: "a cantaloupe",
    35: "a honeydew",
    36: "a head of romaine",
    37: "a bunch of swiss chard",
    38: "a leek",
    39: "a mini watermelon",
    40: "a small pumpkin",
  };
  const keys = Object.keys(sizes)
    .map(Number)
    .sort((a, b) => a - b);
  let best = keys[0];
  for (const k of keys) if (k <= week) best = k;
  return sizes[best];
}

export type TimeBand = "morning" | "afternoon" | "evening" | "night";

export function timeBand(date = new Date()): TimeBand {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

export function greetingFor(name: string | undefined, band: TimeBand): string {
  const who = name ? `, ${name.toLowerCase()}` : "";
  switch (band) {
    case "morning":
      return `good morning${who}`;
    case "afternoon":
      return `good afternoon${who}`;
    case "evening":
      return `good evening${who}`;
    case "night":
      return `hey night owl${who}`;
  }
}

export function formatDueDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
