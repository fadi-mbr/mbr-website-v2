/**
 * Curated catalog of car makes + models — luxury / exotic / premium focused.
 *
 * MBR's clientele is luxury & exotic, so the catalog is biased that direction.
 * Mainstream brands (Toyota, Honda, etc.) are included only insofar as MBR
 * occasionally services premium variants from them (Mustang, Corvette, etc.).
 *
 * The synthetic "Other (type in)" entry exists as a fallback for edge cases;
 * the picker translates it into a free-text input. The sentinel value used
 * for "Other" is the string '__OTHER__' so we never collide with a real
 * make/model name.
 *
 * Data size: ~30 makes × ~10-20 models ≈ ~400 entries. Serialised this is
 * roughly 30-50 KB before gzip — comfortably small enough to ship in the
 * client bundle.
 */

export interface CarMake {
  name: string;
  models: string[];
  /** Optional alias names for search (e.g. "Merc" → "Mercedes-Benz"). */
  aliases?: string[];
}

/** Sentinel for the "Other (type in)" fallback option. */
export const OTHER_SENTINEL = '__OTHER__';

/** Display label for the fallback option in the dropdown. */
export const OTHER_LABEL = 'Other (type in)';

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export const CAR_CATALOG: CarMake[] = [
  // -------- Tier 1 — Exotic / hypercar --------
  {
    name: 'Aston Martin',
    aliases: ['Aston'],
    models: [
      'DB11', 'DB12', 'DBS', 'DBX', 'Vantage', 'Vanquish', 'Rapide',
      'Valkyrie', 'Valhalla', 'Vulcan', 'One-77',
    ],
  },
  {
    name: 'Bentley',
    models: [
      'Continental GT', 'Continental GTC', 'Flying Spur', 'Bentayga',
      'Mulsanne', 'Arnage', 'Azure', 'Brooklands',
    ],
  },
  {
    name: 'Bugatti',
    models: ['Chiron', 'Veyron', 'Divo', 'Centodieci', 'Bolide', 'Mistral', 'Tourbillon'],
  },
  {
    name: 'Ferrari',
    models: [
      '296 GTB', '296 GTS', '488 GTB', '488 Spider', '488 Pista',
      '812 Superfast', '812 GTS', 'F8 Tributo', 'F8 Spider',
      'Roma', 'Portofino', 'Portofino M',
      'SF90 Stradale', 'SF90 Spider', 'SF90 XX',
      'Purosangue', 'LaFerrari', '12Cilindri',
      'California T', 'GTC4Lusso', 'Monza SP1', 'Monza SP2',
    ],
  },
  {
    name: 'Koenigsegg',
    models: ['Jesko', 'Gemera', 'Regera', 'Agera', 'CCXR', 'One:1'],
  },
  {
    name: 'Lamborghini',
    aliases: ['Lambo'],
    models: [
      'Aventador', 'Aventador SVJ', 'Huracan', 'Huracan EVO', 'Huracan STO',
      'Huracan Tecnica', 'Huracan Sterrato',
      'Revuelto', 'Urus', 'Urus Performante', 'Urus SE',
      'Countach', 'Sian', 'Centenario',
    ],
  },
  {
    name: 'Maserati',
    models: [
      'Ghibli', 'Quattroporte', 'Levante', 'Grecale', 'GranTurismo',
      'GranCabrio', 'MC20', 'MC20 Cielo',
    ],
  },
  {
    name: 'McLaren',
    models: [
      '720S', '720S Spider', '750S', '765LT', 'Artura', 'GT',
      '570S', '600LT', 'Senna', 'Speedtail', 'Elva', 'P1', 'W1',
    ],
  },
  {
    name: 'Pagani',
    models: ['Huayra', 'Huayra Roadster', 'Utopia', 'Zonda', 'Zonda R', 'Imola'],
  },
  {
    name: 'Rolls-Royce',
    aliases: ['Rolls Royce', 'RR'],
    models: [
      'Ghost', 'Phantom', 'Wraith', 'Dawn', 'Cullinan', 'Spectre',
      'Silver Shadow', 'Silver Spirit',
    ],
  },

  // -------- Tier 2 — Performance luxury --------
  {
    name: 'Mercedes-AMG',
    aliases: ['AMG'],
    models: [
      'AMG GT', 'AMG GT C', 'AMG GT R', 'AMG GT 63',
      'AMG SL', 'AMG SLS', 'AMG C 63', 'AMG E 63', 'AMG S 63',
      'AMG G 63', 'AMG GLE 63', 'AMG GLS 63', 'AMG GT 4-Door', 'ONE',
    ],
  },
  {
    name: 'BMW M',
    aliases: ['M Series'],
    models: [
      'M2', 'M3', 'M4', 'M5', 'M8', 'X3 M', 'X4 M', 'X5 M', 'X6 M',
      'XM', 'M2 CS', 'M3 CS', 'M4 CSL', 'M5 CS',
    ],
  },
  {
    name: 'Audi RS',
    aliases: ['RS'],
    models: [
      'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'RS Q3', 'RS Q5', 'RS Q8',
      'RS e-tron GT', 'R8', 'R8 Spyder', 'TT RS',
    ],
  },
  {
    name: 'Lexus F',
    aliases: ['Lexus'],
    models: [
      'LFA', 'RC F', 'GS F', 'IS F', 'LC 500', 'LX 600', 'LS 500',
      'ES 350', 'NX 350', 'RX 500h', 'GX 550',
    ],
  },
  {
    name: 'Cadillac',
    aliases: ['Caddy'],
    models: [
      'CT4-V', 'CT5-V', 'CT5-V Blackwing', 'CTS-V', 'Escalade',
      'Escalade-V', 'XT4', 'XT5', 'XT6', 'Lyriq', 'Celestiq',
    ],
  },
  {
    name: 'Porsche',
    models: [
      '911', '911 Turbo', '911 GT3', '911 GT3 RS', '911 Carrera',
      '911 Targa', '911 Dakar', 'Cayenne', 'Cayenne Coupe',
      'Macan', 'Macan EV', 'Panamera', 'Taycan', 'Taycan Cross Turismo',
      '718 Cayman', '718 Boxster', '718 Spyder', '918 Spyder',
    ],
  },
  {
    name: 'Tesla',
    models: [
      'Model S', 'Model S Plaid', 'Model 3', 'Model X', 'Model X Plaid',
      'Model Y', 'Cybertruck', 'Roadster',
    ],
  },

  // -------- Tier 3 — Premium --------
  {
    name: 'Acura',
    models: [
      'NSX', 'MDX', 'RDX', 'TLX', 'ILX', 'Integra', 'ZDX',
    ],
  },
  {
    name: 'Audi',
    models: [
      'A3', 'A4', 'A5', 'A6', 'A7', 'A8',
      'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'Q8 e-tron',
      'e-tron GT', 'TT', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8',
    ],
  },
  {
    name: 'BMW',
    models: [
      '1 Series', '2 Series', '3 Series', '4 Series', '5 Series',
      '6 Series', '7 Series', '8 Series',
      'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7',
      'iX', 'iX1', 'iX3', 'i4', 'i5', 'i7', 'Z4',
    ],
  },
  {
    name: 'Genesis',
    models: ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80', 'GV90'],
  },
  {
    name: 'Infiniti',
    models: ['Q50', 'Q60', 'Q70', 'QX50', 'QX55', 'QX60', 'QX70', 'QX80'],
  },
  {
    name: 'Jaguar',
    models: ['F-Type', 'F-Pace', 'E-Pace', 'I-Pace', 'XE', 'XF', 'XJ', 'XK'],
  },
  {
    name: 'Land Rover',
    models: [
      'Defender', 'Defender 90', 'Defender 110', 'Defender 130',
      'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport',
      'Range Rover Velar', 'Range Rover Evoque',
    ],
  },
  {
    name: 'Lincoln',
    models: ['Aviator', 'Corsair', 'Nautilus', 'Navigator', 'MKZ', 'MKX', 'Continental'],
  },
  {
    name: 'Mercedes-Benz',
    aliases: ['Mercedes', 'Merc', 'Benz', 'MB'],
    models: [
      'A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class',
      'CLA', 'CLS', 'CL', 'SL', 'SLC', 'SLK',
      'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class',
      'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'EQS SUV', 'EQE SUV',
      'V-Class', 'Vito', 'Maybach S-Class', 'Maybach GLS', 'AMG GT',
    ],
  },
  {
    name: 'Volvo',
    models: ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'EX30', 'EX90', 'C40'],
  },

  // -------- Tier 4 — Mainstream-but-MBR-may-still-service --------
  {
    name: 'Chevrolet',
    aliases: ['Chevy'],
    models: [
      'Corvette', 'Corvette Z06', 'Corvette ZR1', 'Corvette E-Ray',
      'Camaro', 'Camaro ZL1', 'Camaro SS',
      'Tahoe', 'Suburban', 'Silverado', 'Blazer', 'Trailblazer',
    ],
  },
  {
    name: 'Ford',
    models: [
      'Mustang', 'Mustang GT', 'Mustang Mach-E', 'Mustang Shelby GT500',
      'F-150', 'F-150 Raptor', 'F-150 Lightning', 'Bronco',
      'Bronco Raptor', 'Ranger Raptor', 'Edge', 'Explorer', 'Expedition', 'GT',
    ],
  },
  {
    name: 'GMC',
    models: [
      'Yukon', 'Yukon Denali', 'Yukon XL', 'Sierra', 'Sierra Denali',
      'Hummer EV', 'Hummer EV SUV', 'Acadia', 'Terrain',
    ],
  },
  {
    name: 'Honda',
    models: [
      'Civic', 'Civic Type R', 'Accord', 'CR-V', 'HR-V', 'Pilot',
      'Passport', 'Ridgeline', 'NSX',
    ],
  },
  {
    name: 'Nissan',
    models: [
      'GT-R', 'GT-R Nismo', '370Z', '400Z', 'Z', 'Skyline',
      'Patrol', 'Patrol Nismo', 'Armada', 'Pathfinder', 'Maxima', 'Altima',
    ],
  },
  {
    name: 'Toyota',
    models: [
      'Land Cruiser', 'Land Cruiser 300', 'Land Cruiser Prado',
      'Supra', 'GR Supra', 'GR Corolla', 'GR Yaris', '86', 'GR86',
      'Camry', 'Highlander', 'Sequoia', 'Tundra', 'Hilux', '4Runner',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Derived data                                                        */
/* ------------------------------------------------------------------ */

const SORTED_MAKE_NAMES = CAR_CATALOG.map((m) => m.name).sort((a, b) =>
  a.localeCompare(b)
);

/**
 * All makes alphabetically, plus the synthetic "Other" entry at the top.
 * Use this for rendering the make dropdown.
 */
export const ALL_MAKES_PLUS_OTHER: string[] = [
  OTHER_SENTINEL,
  ...SORTED_MAKE_NAMES,
];

/** Internal lookup index: make name (lowercase) → CarMake */
const MAKE_INDEX: Map<string, CarMake> = new Map(
  CAR_CATALOG.map((m) => [m.name.toLowerCase(), m])
);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Get the model list for a make. Returns `[]` for the OTHER sentinel or
 * an unknown make name. Model list does NOT include the synthetic "Other"
 * entry — append it in the picker if you want that fallback.
 */
export function getModelsForMake(make: string): string[] {
  if (!make || make === OTHER_SENTINEL) return [];
  const entry = MAKE_INDEX.get(make.toLowerCase());
  return entry ? entry.models.slice() : [];
}

/**
 * Case-insensitive search across make names and aliases.
 * Returns the canonical make names matching `q`, alphabetically sorted.
 *
 * Empty query → returns ALL_MAKES_PLUS_OTHER unchanged.
 */
export function searchMakes(q: string): string[] {
  const query = q.trim().toLowerCase();
  if (!query) return ALL_MAKES_PLUS_OTHER.slice();
  const results: string[] = [];
  // Always include OTHER at the top so users have an escape hatch.
  results.push(OTHER_SENTINEL);
  for (const make of CAR_CATALOG) {
    const nameMatch = make.name.toLowerCase().includes(query);
    const aliasMatch = (make.aliases ?? []).some((a) =>
      a.toLowerCase().includes(query)
    );
    if (nameMatch || aliasMatch) results.push(make.name);
  }
  // Stable sort of matched real makes (OTHER stays first via the slice).
  const [other, ...rest] = results;
  rest.sort((a, b) => a.localeCompare(b));
  return [other, ...rest];
}

/**
 * Case-insensitive contains search within a make's model list. Returns the
 * synthetic OTHER sentinel first followed by matching models. Returns just
 * `[OTHER_SENTINEL]` for an unknown make or for the OTHER make sentinel.
 */
export function searchModels(make: string, q: string): string[] {
  if (!make || make === OTHER_SENTINEL) return [OTHER_SENTINEL];
  const models = getModelsForMake(make);
  const query = q.trim().toLowerCase();
  if (!query) return [OTHER_SENTINEL, ...models];
  const filtered = models.filter((m) => m.toLowerCase().includes(query));
  return [OTHER_SENTINEL, ...filtered];
}

/** Total model count across the catalog — useful for tests / sizing. */
export function totalModelCount(): number {
  return CAR_CATALOG.reduce((acc, m) => acc + m.models.length, 0);
}
