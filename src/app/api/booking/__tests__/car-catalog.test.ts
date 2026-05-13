/**
 * Unit tests for the curated car catalog (`src/lib/car-catalog.ts`).
 */

import {
  ALL_MAKES_PLUS_OTHER,
  CAR_CATALOG,
  OTHER_SENTINEL,
  getModelsForMake,
  searchMakes,
  searchModels,
  totalModelCount,
} from "../../../../lib/car-catalog";
import { assert, assertEqual, runSuite } from "./_harness";

export default () => runSuite("car-catalog", [
  {
    name: "catalog has at least 25 makes",
    fn: () => assert(CAR_CATALOG.length >= 25, `got ${CAR_CATALOG.length}`),
  },
  {
    name: "catalog totals ~400 models (300+)",
    fn: () => {
      const t = totalModelCount();
      assert(t >= 300, `expected ≥300 models, got ${t}`);
    },
  },
  {
    name: "ALL_MAKES_PLUS_OTHER starts with OTHER sentinel",
    fn: () =>
      assertEqual(ALL_MAKES_PLUS_OTHER[0], OTHER_SENTINEL),
  },
  {
    name: "ALL_MAKES_PLUS_OTHER is alphabetical after the sentinel",
    fn: () => {
      const rest = ALL_MAKES_PLUS_OTHER.slice(1);
      const sorted = rest.slice().sort((a, b) => a.localeCompare(b));
      assertEqual(rest, sorted);
    },
  },
  {
    name: "every make has at least 5 models",
    fn: () => {
      for (const m of CAR_CATALOG) {
        assert(m.models.length >= 5, `${m.name} only has ${m.models.length} models`);
      }
    },
  },
  {
    name: "getModelsForMake('Ferrari') includes 296 GTB",
    fn: () => {
      const m = getModelsForMake('Ferrari');
      assert(m.includes('296 GTB'), `got ${JSON.stringify(m)}`);
    },
  },
  {
    name: "getModelsForMake is case-insensitive",
    fn: () => {
      const a = getModelsForMake('ferrari');
      const b = getModelsForMake('Ferrari');
      assertEqual(a, b);
    },
  },
  {
    name: "getModelsForMake returns [] for OTHER sentinel",
    fn: () => assertEqual(getModelsForMake(OTHER_SENTINEL), []),
  },
  {
    name: "getModelsForMake returns [] for unknown make",
    fn: () => assertEqual(getModelsForMake('NonExistentMake'), []),
  },
  {
    name: "searchMakes empty query returns all makes plus OTHER",
    fn: () => {
      const r = searchMakes('');
      assertEqual(r.length, ALL_MAKES_PLUS_OTHER.length);
    },
  },
  {
    name: "searchMakes 'fer' matches Ferrari and includes OTHER first",
    fn: () => {
      const r = searchMakes('fer');
      assertEqual(r[0], OTHER_SENTINEL);
      assert(r.includes('Ferrari'), `got ${JSON.stringify(r)}`);
    },
  },
  {
    name: "searchMakes alias 'merc' matches Mercedes-Benz",
    fn: () => {
      const r = searchMakes('merc');
      assert(r.includes('Mercedes-Benz'), `got ${JSON.stringify(r)}`);
    },
  },
  {
    name: "searchMakes alias 'lambo' matches Lamborghini",
    fn: () => {
      const r = searchMakes('lambo');
      assert(r.includes('Lamborghini'), `got ${JSON.stringify(r)}`);
    },
  },
  {
    name: "searchModels for Porsche '911' returns models containing 911",
    fn: () => {
      const r = searchModels('Porsche', '911');
      // First entry is the OTHER sentinel.
      assertEqual(r[0], OTHER_SENTINEL);
      const models = r.slice(1);
      assert(
        models.every((m) => m.includes('911')),
        `got ${JSON.stringify(models)}`
      );
      assert(models.length >= 3, `expected several 911 variants, got ${models.length}`);
    },
  },
  {
    name: "searchModels with empty query returns OTHER + full list",
    fn: () => {
      const r = searchModels('Porsche', '');
      assertEqual(r[0], OTHER_SENTINEL);
      assertEqual(r.length, getModelsForMake('Porsche').length + 1);
    },
  },
  {
    name: "searchModels for OTHER make returns only the sentinel",
    fn: () =>
      assertEqual(searchModels(OTHER_SENTINEL, 'anything'), [OTHER_SENTINEL]),
  },
  {
    name: "searchModels for unknown make returns only the sentinel",
    fn: () =>
      assertEqual(searchModels('NopeMake', ''), [OTHER_SENTINEL]),
  },
]);
