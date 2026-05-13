/**
 * Unit tests for the agent booking page's prefill projection
 * (`projectPrefill`, exported from `src/app/book/agent/page.tsx`).
 *
 * Covers the Chatwoot `custom_attributes` → form prefill mapping added for
 * the vehicle write-back round trip.
 */

import { projectPrefill } from '../../../book/agent/page';
import type { ChatwootContact } from '@/lib/chatwoot-client';
import { assertEqual, runSuite } from './_harness';

export default function suite() {
  return runSuite('agent-page projectPrefill', [
    {
      name: 'null contact → {}',
      fn: () => assertEqual(projectPrefill(null), {}),
    },
    {
      name: 'name + phone + email surface as firstName/lastName/phone/email',
      fn: () => {
        const c: ChatwootContact = {
          id: 5,
          name: 'Aamish Khan',
          email: 'a@b.c',
          phone_number: '+971501234567',
        };
        assertEqual(projectPrefill(c), {
          firstName: 'Aamish',
          lastName: 'Khan',
          phone: '971501234567',
          email: 'a@b.c',
        });
      },
    },
    {
      name: 'vehicle_year as number is surfaced',
      fn: () => {
        const c: ChatwootContact = {
          id: 5,
          custom_attributes: { vehicle_year: 2023 },
        };
        assertEqual(projectPrefill(c), { vehicleYear: 2023 });
      },
    },
    {
      name: 'vehicle_year as 4-digit string is coerced to number',
      fn: () => {
        const c: ChatwootContact = {
          id: 5,
          custom_attributes: { vehicle_year: '2023' },
        };
        assertEqual(projectPrefill(c), { vehicleYear: 2023 });
      },
    },
    {
      name: 'vehicle_year garbage is silently skipped',
      fn: () => {
        const c: ChatwootContact = {
          id: 5,
          custom_attributes: { vehicle_year: 'not-a-year' },
        };
        assertEqual(projectPrefill(c), {});
      },
    },
    {
      name: 'all four vehicle attrs surface together',
      fn: () => {
        const c: ChatwootContact = {
          id: 5,
          custom_attributes: {
            vehicle_year: 2023,
            vehicle_make: 'Ferrari',
            vehicle_model: '296 GTB',
            vehicle_plate: 'Dubai M 12345',
          },
        };
        assertEqual(projectPrefill(c), {
          vehicleYear: 2023,
          vehicleMake: 'Ferrari',
          vehicleModel: '296 GTB',
          vehiclePlate: 'Dubai M 12345',
        });
      },
    },
    {
      name: 'name + vehicle attrs combine without losing fields',
      fn: () => {
        const c: ChatwootContact = {
          id: 5,
          name: 'Aamish Khan',
          custom_attributes: {
            vehicle_year: 2023,
            vehicle_make: 'Ferrari',
            vehicle_model: '296 GTB',
            vehicle_plate: 'Dubai M 12345',
          },
        };
        assertEqual(projectPrefill(c), {
          firstName: 'Aamish',
          lastName: 'Khan',
          vehicleYear: 2023,
          vehicleMake: 'Ferrari',
          vehicleModel: '296 GTB',
          vehiclePlate: 'Dubai M 12345',
        });
      },
    },
    {
      name: 'empty-string vehicle fields are skipped (not stored)',
      fn: () => {
        const c: ChatwootContact = {
          id: 5,
          custom_attributes: {
            vehicle_make: '   ',
            vehicle_model: '',
            vehicle_plate: '',
          },
        };
        assertEqual(projectPrefill(c), {});
      },
    },
    {
      name: 'no custom_attributes block on contact → no vehicle fields',
      fn: () => {
        const c: ChatwootContact = { id: 5, name: 'Solo' };
        assertEqual(projectPrefill(c), { firstName: 'Solo' });
      },
    },
  ]);
}
