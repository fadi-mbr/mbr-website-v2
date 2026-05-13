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
