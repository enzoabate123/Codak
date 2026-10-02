/**
 * grimoire-linker — converts plain text into linkable fragments using the EntityRegistry.
 *
 * Uses greedy longest-match so "Extended Barrel" won't partially match as "Extended".
 * Matching is case-insensitive; fragments preserve original case from source text.
 *
 * v2: Fixed false-match bug where character-by-character consumption caused mid-word
 * substrings to appear at position 0, bypassing boundary checks (e.g., "har" inside "falhar").
 * Now tracks global offset into the original text for accurate boundary detection.
 */

import { getEntityRegistry } from '@/lib/entity-registry';

export interface TextFragment {
  text: string;
  /** If present, clicking this fragment should navigate to this prefixed entryId */
  linkTo?: string;
}

/** Characters considered word boundaries for entity matching */
const BOUNDARY_RE = /[\s,;:.()\[\]'"\/\-!?&+•\n\r\t]/;

function isWordBoundary(text: string, pos: number): boolean {
  if (pos < 0 || pos >= text.length) return true; // start/end of text
  return BOUNDARY_RE.test(text[pos]);
}

/**
 * Splits `text` into fragments, tagging any recognized entity name with its entryId.
 * Consecutive plain-text fragments are merged for efficiency.
 */
export function linkifyText(text: string): TextFragment[] {
  if (!text) return [{ text }];

  const registry = getEntityRegistry();
  const sortedNames = registry.getSortedNames(); // longest first

  const lowerText = text.toLowerCase();
  const fragments: TextFragment[] = [];
  let offset = 0;

  while (offset < text.length) {
    let bestMatch: { start: number; length: number; entryId: string } | null = null;

    // Try each entity name (longest first) to find the earliest valid match
    for (const { lower, entryId } of sortedNames) {
      // Skip very short terms that would create too many false positives (< 3 chars)
      if (lower.length < 3) continue;

      // Search for this entity starting from current offset
      const idx = lowerText.indexOf(lower, offset);
      if (idx === -1) continue;

      // Word boundary check using the ORIGINAL text positions
      const beforeOk = isWordBoundary(text, idx - 1);
      const afterOk = isWordBoundary(text, idx + lower.length);

      if (!beforeOk || !afterOk) continue;

      // Take the earliest match, or the longest if tied
      if (!bestMatch || idx < bestMatch.start || (idx === bestMatch.start && lower.length > bestMatch.length)) {
        bestMatch = { start: idx, length: lower.length, entryId };
      }

      // If we found a match at the current offset, it can't start any earlier
      if (idx === offset) break;
    }

    if (bestMatch) {
      // Emit any plain text before the match
      if (bestMatch.start > offset) {
        const plainText = text.slice(offset, bestMatch.start);
        const last = fragments[fragments.length - 1];
        if (last && !last.linkTo) {
          last.text += plainText;
        } else {
          fragments.push({ text: plainText });
        }
      }

      // Emit the linked fragment (preserving original casing)
      fragments.push({
        text: text.slice(bestMatch.start, bestMatch.start + bestMatch.length),
        linkTo: bestMatch.entryId,
      });

      offset = bestMatch.start + bestMatch.length;
    } else {
      // No match found in entire remaining text — emit the rest as plain text
      const restText = text.slice(offset);
      const last = fragments[fragments.length - 1];
      if (last && !last.linkTo) {
        last.text += restText;
      } else {
        fragments.push({ text: restText });
      }
      break;
    }
  }

  return fragments;
}
