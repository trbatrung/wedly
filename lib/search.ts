import { normalize } from "./domain";

export type Command = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  color?: string;
  // Deep links (e.g. "Minh & Anh › Khách mời") appear only while searching.
  deep?: boolean;
  run: () => void;
};
const PER_GROUP = 6;
// Diacritic-insensitive, multi-word search: "khach moi minh" finds
// "Minh & Anh › Khách mời". Groups keep their given order; inside a group,
// labels that start with the query rank first, then shorter labels.
export function filterCommands(
  commands: Command[],
  query: string,
  groupOrder: string[],
) {
  const q = normalize(query.trim());
  const rank = (group: string) => {
    const i = groupOrder.indexOf(group);
    return i < 0 ? groupOrder.length : i;
  };
  if (!q)
    return commands
      .filter((c) => !c.deep)
      .sort((a, b) => rank(a.group) - rank(b.group));
  const tokens = q.split(/\s+/);
  const scored = commands
    .map((command) => {
      const label = normalize(command.label);
      const haystack = `${label} ${normalize(command.hint ?? "")} ${normalize(command.keywords ?? "")}`;
      if (!tokens.every((t) => haystack.includes(t))) return null;
      const score = label.startsWith(q)
        ? 0
        : label.includes(q)
          ? 1
          : tokens.every((t) => label.includes(t))
            ? 2
            : 3;
      return { command, score };
    })
    .filter((x): x is { command: Command; score: number } => x !== null)
    .sort(
      (a, b) =>
        rank(a.command.group) - rank(b.command.group) ||
        a.score - b.score ||
        a.command.label.length - b.command.label.length,
    );
  const counts = new Map<string, number>();
  return scored
    .filter(({ command }) => {
      const n = counts.get(command.group) ?? 0;
      counts.set(command.group, n + 1);
      return n < PER_GROUP;
    })
    .map(({ command }) => command);
}
