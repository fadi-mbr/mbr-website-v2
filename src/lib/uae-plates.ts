/**
 * UAE licence-plate data + helpers.
 *
 * Each emirate uses its own category-code system. The lists below are
 * curated against the current RTA / police conventions; we err on the side
 * of slightly over-including rather than rejecting a valid plate. If the
 * driver has a non-UAE plate they pick "Foreign plate" and we fall back to
 * a single free-text field ("KSA 1234 XYZ").
 *
 * Display format:
 *   - UAE: "<Emirate> <Category> <Number>"  e.g. "Dubai M 12345"
 *   - Foreign: "Foreign: <text>"            e.g. "Foreign: KSA 1234 XYZ"
 */

export interface EmirateCategoryList {
  emirate: string;
  /** Arabic name, optional. */
  emirateAr?: string;
  categories: string[];
  /** UI hint shown under the category dropdown. */
  hint?: string;
}

/** Sentinel emirate value meaning "Foreign / non-UAE plate". */
export const FOREIGN_SENTINEL = 'Foreign plate';

export const UAE_PLATE_DATA: EmirateCategoryList[] = [
  {
    emirate: 'Dubai',
    emirateAr: 'دبي',
    categories: [
      'A','B','C','D','E','F','G','H','I','J','K','L','M',
      'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
    ],
    hint: 'Letter code on a Dubai plate, e.g. M 12345.',
  },
  {
    emirate: 'Abu Dhabi',
    emirateAr: 'أبو ظبي',
    categories: [
      '1','2','3','4','5','6','7','8','9','10',
      '11','12','13','14','15','16','17','18','19','20',
      '21','22','50',
    ],
    hint: 'Number code (1–50) on an Abu Dhabi plate.',
  },
  {
    emirate: 'Sharjah',
    emirateAr: 'الشارقة',
    categories: ['1', '2', '3', '4', '5'],
    hint: 'Sharjah uses a single-digit category code.',
  },
  {
    emirate: 'Ajman',
    emirateAr: 'عجمان',
    categories: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  },
  {
    emirate: 'Ras Al Khaimah',
    emirateAr: 'رأس الخيمة',
    categories: ['A','B','C','D','E','F','G','H','I','K','M','N','P','S','T','V','Y'],
  },
  {
    emirate: 'Umm Al Quwain',
    emirateAr: 'أم القيوين',
    categories: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  },
  {
    emirate: 'Fujairah',
    emirateAr: 'الفجيرة',
    categories: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  },
];

/** All emirates (sorted as authored — Dubai first, then by population). */
export const EMIRATE_NAMES: string[] = UAE_PLATE_DATA.map((e) => e.emirate);

/** All emirates plus the foreign-plate fallback. */
export const EMIRATE_NAMES_PLUS_FOREIGN: string[] = [
  ...EMIRATE_NAMES,
  FOREIGN_SENTINEL,
];

const EMIRATE_INDEX: Map<string, EmirateCategoryList> = new Map(
  UAE_PLATE_DATA.map((e) => [e.emirate, e])
);

/**
 * Get the category codes for an emirate. Returns `[]` for "Foreign plate"
 * or an unknown emirate.
 */
export function getCategoriesForEmirate(emirate: string): string[] {
  if (!emirate || emirate === FOREIGN_SENTINEL) return [];
  const entry = EMIRATE_INDEX.get(emirate);
  return entry ? entry.categories.slice() : [];
}

/** Tooltip / helper hint for an emirate, or `undefined`. */
export function getHintForEmirate(emirate: string): string | undefined {
  return EMIRATE_INDEX.get(emirate)?.hint;
}

/**
 * Compose a human-readable plate string from the picker fields.
 * - UAE: "Dubai M 12345"
 * - Foreign: "Foreign: KSA 1234 XYZ"
 * Returns an empty string if there's not enough data to form a plate.
 */
export function formatPlate(args: {
  emirate: string;
  category: string;
  number: string;
  foreignText: string;
}): string {
  const { emirate, category, number, foreignText } = args;
  if (!emirate) return '';
  if (emirate === FOREIGN_SENTINEL) {
    const t = foreignText.trim();
    return t ? `Foreign: ${t}` : '';
  }
  const cat = category.trim();
  const num = number.trim();
  if (!cat || !num) return '';
  return `${emirate} ${cat} ${num}`;
}

/** True if the digit-only plate number is structurally OK (1–5 digits). */
export function isValidPlateNumber(n: string): boolean {
  return /^\d{1,5}$/.test(n.trim());
}

/**
 * Shape returned by `parsePlate` — the inverse of `formatPlate`.
 *
 * If the input string is not parseable as either a UAE or a foreign plate,
 * every field is the empty string and the caller can fall back to leaving
 * the picker empty.
 */
export interface ParsedPlate {
  emirate: string;
  category: string;
  number: string;
  foreignText: string;
}

const EMPTY_PARSED: ParsedPlate = {
  emirate: '',
  category: '',
  number: '',
  foreignText: '',
};

/**
 * Decompose a stored plate string back into the picker's four fields.
 *
 * Accepts:
 *   - `Dubai M 12345`                          → UAE
 *   - `Abu Dhabi 12 9999`                      → UAE (multi-word emirate)
 *   - `Foreign: KSA 9999 ABC`                  → foreign with `Foreign:` prefix
 *   - `Foreign plate KSA 9999 ABC`             → foreign without colon
 *   - unrecognised input                       → all-empty (caller falls back)
 *
 * Notes:
 *   - UAE matching is greedy on the emirate name (longest match wins). The
 *     last whitespace-separated token must be 1–5 digits.
 *   - Whitespace between tokens is collapsed; surrounding whitespace ignored.
 *   - We do NOT validate that the category exists in
 *     `getCategoriesForEmirate` — if the catalog is updated or the stored
 *     plate is from an old entry, we still let the picker show what we have
 *     instead of silently dropping it.
 */
export function parsePlate(raw: string | undefined | null): ParsedPlate {
  if (!raw) return { ...EMPTY_PARSED };
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s) return { ...EMPTY_PARSED };

  // ---- Foreign path (two recognised shapes) -------------------------------
  // `Foreign: <text>` (matches `formatPlate` output)
  const foreignColon = /^foreign\s*:\s*(.+)$/i.exec(s);
  if (foreignColon) {
    const t = foreignColon[1].trim();
    return t
      ? { emirate: FOREIGN_SENTINEL, category: '', number: '', foreignText: t }
      : { ...EMPTY_PARSED };
  }
  // `Foreign plate <text>` (matches the picker emirate label)
  const foreignPrefix = /^foreign\s+plate\s+(.+)$/i.exec(s);
  if (foreignPrefix) {
    const t = foreignPrefix[1].trim();
    return t
      ? { emirate: FOREIGN_SENTINEL, category: '', number: '', foreignText: t }
      : { ...EMPTY_PARSED };
  }
  // Bare `Foreign plate` with no body — treat as foreign with empty text.
  if (/^foreign(\s+plate)?$/i.test(s)) {
    return { emirate: FOREIGN_SENTINEL, category: '', number: '', foreignText: '' };
  }

  // ---- UAE path -----------------------------------------------------------
  // Greedy emirate match: try the longest known emirate prefix first so
  // "Abu Dhabi 12 9999" parses as ("Abu Dhabi", "12", "9999").
  const lower = s.toLowerCase();
  const sortedEmirates = [...EMIRATE_NAMES].sort(
    (a, b) => b.length - a.length,
  );
  let matchedEmirate: string | null = null;
  let rest = '';
  for (const e of sortedEmirates) {
    const ePrefix = e.toLowerCase() + ' ';
    if (lower.startsWith(ePrefix)) {
      matchedEmirate = e;
      rest = s.slice(e.length).trim();
      break;
    }
  }
  if (!matchedEmirate || !rest) return { ...EMPTY_PARSED };

  const parts = rest.split(/\s+/).filter((x) => x.length > 0);
  if (parts.length < 2) return { ...EMPTY_PARSED };

  const num = parts[parts.length - 1];
  if (!/^\d{1,5}$/.test(num)) return { ...EMPTY_PARSED };
  // Everything between emirate and number is the category code. We keep
  // multi-token categories joined by a space (defensive — none of the
  // current catalog has them, but it's harmless if they appear).
  const cat = parts.slice(0, parts.length - 1).join(' ');
  if (!cat) return { ...EMPTY_PARSED };

  return { emirate: matchedEmirate, category: cat, number: num, foreignText: '' };
}
