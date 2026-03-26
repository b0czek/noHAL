import type { IniReferenceSection, MatchedIniReference } from "./iniReference";

export interface ActiveIniReferenceQuery {
  start: number;
  end: number;
  text: string;
  normalizedText: string;
}

const INI_REFERENCE_FRAGMENT_PATTERN = /^\[[A-Za-z0-9_]*(?:\][A-Za-z0-9_]*)?/;

export function flattenIniReferenceSections(
  sections: readonly IniReferenceSection[],
): MatchedIniReference[] {
  return sections.flatMap((section) =>
    section.entries.map((entry) => ({
      ...entry,
      sectionName: section.name,
    })),
  );
}

export function getActiveIniReferenceQuery(
  value: string,
  caret: number,
): ActiveIniReferenceQuery | null {
  const cursor = Math.max(0, Math.min(caret, value.length));
  const start = value.lastIndexOf("[", cursor - 1);
  if (start < 0) return null;

  const fragment = value.slice(start);
  const match = INI_REFERENCE_FRAGMENT_PATTERN.exec(fragment);
  if (!match) return null;

  const end = start + match[0].length;
  if (cursor > end) return null;

  const text = value.slice(start, cursor);
  return {
    start,
    end,
    text,
    normalizedText: text.trim().toUpperCase(),
  };
}

export function filterIniReferenceSuggestions(
  entries: readonly MatchedIniReference[],
  query: ActiveIniReferenceQuery | null,
): MatchedIniReference[] {
  if (!query) return [];

  const normalizedQuery = query.normalizedText;
  if (!normalizedQuery || normalizedQuery === "[") {
    return [...entries];
  }

  return entries.filter((entry) =>
    [entry.token, entry.sectionName, entry.key, entry.value].some((candidate) =>
      candidate.toUpperCase().includes(normalizedQuery),
    ),
  );
}

export function applyIniReferenceSuggestion(
  value: string,
  query: ActiveIniReferenceQuery,
  token: string,
): { nextValue: string; caret: number } {
  const nextValue =
    value.slice(0, query.start) + token + value.slice(query.end);
  return {
    nextValue,
    caret: query.start + token.length,
  };
}
