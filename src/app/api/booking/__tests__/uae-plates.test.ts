/**
 * Unit tests for the UAE plate helpers (`src/lib/uae-plates.ts`).
 */

import {
  EMIRATE_NAMES,
  EMIRATE_NAMES_PLUS_FOREIGN,
  FOREIGN_SENTINEL,
  UAE_PLATE_DATA,
  formatPlate,
  getCategoriesForEmirate,
  getHintForEmirate,
  isValidPlateNumber,
} from "../../../../lib/uae-plates";
import { assert, assertEqual, runSuite } from "./_harness";

export default () => runSuite("uae-plates", [
  {
    name: "exactly 7 emirates",
    fn: () => assertEqual(EMIRATE_NAMES.length, 7),
  },
  {
    name: "includes Dubai and Abu Dhabi",
    fn: () => {
      assert(EMIRATE_NAMES.includes('Dubai'));
      assert(EMIRATE_NAMES.includes('Abu Dhabi'));
    },
  },
  {
    name: "EMIRATE_NAMES_PLUS_FOREIGN appends the foreign sentinel",
    fn: () => {
      assertEqual(EMIRATE_NAMES_PLUS_FOREIGN.length, 8);
      assertEqual(EMIRATE_NAMES_PLUS_FOREIGN[7], FOREIGN_SENTINEL);
    },
  },
  {
    name: "every emirate has at least one category",
    fn: () => {
      for (const e of UAE_PLATE_DATA) {
        assert(e.categories.length >= 1, `${e.emirate} has no categories`);
      }
    },
  },
  {
    name: "Dubai uses letter categories (A–Z)",
    fn: () => {
      const cats = getCategoriesForEmirate('Dubai');
      assert(cats.includes('A') && cats.includes('Z'));
      assert(cats.every((c) => /^[A-Z]$/.test(c)));
    },
  },
  {
    name: "Abu Dhabi uses numeric categories within 1–50",
    fn: () => {
      const cats = getCategoriesForEmirate('Abu Dhabi');
      assert(cats.includes('1'));
      assert(cats.includes('50'));
      assert(cats.every((c) => /^\d+$/.test(c) && Number(c) >= 1 && Number(c) <= 50));
    },
  },
  {
    name: "getCategoriesForEmirate returns [] for foreign",
    fn: () => assertEqual(getCategoriesForEmirate(FOREIGN_SENTINEL), []),
  },
  {
    name: "getCategoriesForEmirate returns [] for unknown",
    fn: () => assertEqual(getCategoriesForEmirate('Atlantis'), []),
  },
  {
    name: "Dubai hint is non-empty",
    fn: () => assert(!!getHintForEmirate('Dubai')),
  },
  {
    name: "formatPlate UAE: 'Dubai M 12345'",
    fn: () =>
      assertEqual(
        formatPlate({ emirate: 'Dubai', category: 'M', number: '12345', foreignText: '' }),
        'Dubai M 12345'
      ),
  },
  {
    name: "formatPlate foreign: prefixes 'Foreign: '",
    fn: () =>
      assertEqual(
        formatPlate({
          emirate: FOREIGN_SENTINEL,
          category: '',
          number: '',
          foreignText: 'KSA 1234 XYZ',
        }),
        'Foreign: KSA 1234 XYZ'
      ),
  },
  {
    name: "formatPlate UAE: returns '' when category missing",
    fn: () =>
      assertEqual(
        formatPlate({ emirate: 'Dubai', category: '', number: '12345', foreignText: '' }),
        ''
      ),
  },
  {
    name: "formatPlate UAE: returns '' when number missing",
    fn: () =>
      assertEqual(
        formatPlate({ emirate: 'Dubai', category: 'M', number: '', foreignText: '' }),
        ''
      ),
  },
  {
    name: "formatPlate foreign: returns '' when text empty",
    fn: () =>
      assertEqual(
        formatPlate({
          emirate: FOREIGN_SENTINEL,
          category: '',
          number: '',
          foreignText: '   ',
        }),
        ''
      ),
  },
  {
    name: "formatPlate returns '' when emirate empty",
    fn: () =>
      assertEqual(
        formatPlate({ emirate: '', category: 'M', number: '12345', foreignText: '' }),
        ''
      ),
  },
  {
    name: "isValidPlateNumber accepts 1–5 digits",
    fn: () => {
      assert(isValidPlateNumber('1'));
      assert(isValidPlateNumber('12345'));
    },
  },
  {
    name: "isValidPlateNumber rejects empty / 6 digits / letters",
    fn: () => {
      assert(!isValidPlateNumber(''));
      assert(!isValidPlateNumber('123456'));
      assert(!isValidPlateNumber('12A4'));
    },
  },
]);
