import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt =
  'MBR Auto Services. Independent luxury and exotic-car workshop in Dubai.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Dynamic 1200×630 social preview. The MBR wordmark and credential
 * strip render in the 911Porsche brand-voice font (embedded from
 * /public/fonts at request time). Tagline stays default sans for
 * legibility at thumbnail sizes.
 */
export default async function OpenGraphImage() {
  let porscheFont: ArrayBuffer | null = null;
  try {
    const buf = await readFile(
      join(process.cwd(), 'public', 'fonts', '911porschav3.ttf'),
    );
    porscheFont = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;
  } catch {
    porscheFont = null;
  }

  const brandFont = porscheFont ? '911Porsche' : 'sans-serif';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(ellipse at center, #1a0808 0%, #0a0a0a 50%, #000000 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Top red rule */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background:
              'linear-gradient(90deg, transparent 0%, #E30613 30%, #E30613 70%, transparent 100%)',
          }}
        />

        {/* Wordmark — 911Porsche */}
        <div
          style={{
            fontFamily: brandFont,
            fontSize: 200,
            letterSpacing: 8,
            lineHeight: 1,
            display: 'flex',
            color: 'white',
          }}
        >
          MBR
        </div>

        {/* Sub-wordmark — bronze accent in 911Porsche */}
        <div
          style={{
            fontFamily: brandFont,
            fontSize: 28,
            letterSpacing: 14,
            textTransform: 'uppercase',
            color: '#A57842',
            marginTop: 16,
          }}
        >
          Making Better Rides
        </div>

        {/* Bronze hairline divider */}
        <div
          style={{
            width: 96,
            height: 1,
            background: '#A57842',
            marginTop: 44,
            marginBottom: 36,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 40,
            fontWeight: 300,
            color: '#e5e5e5',
            textAlign: 'center',
            maxWidth: 920,
            lineHeight: 1.25,
            letterSpacing: -0.5,
          }}
        >
          Independent Luxury &amp; Exotic-Car Workshop
        </div>

        {/* Location */}
        <div
          style={{
            fontFamily: brandFont,
            fontSize: 20,
            color: '#a1a1aa',
            marginTop: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          Al Quoz Industrial 4 · Dubai · UAE
        </div>

        {/* Credentials strip — 911Porsche */}
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
            fontFamily: brandFont,
            fontSize: 20,
            color: '#d4d4d8',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          <span>Bosch Authorised</span>
          <span style={{ color: '#A57842' }}>·</span>
          <span>Leonardo Diagnostics</span>
          <span style={{ color: '#A57842' }}>·</span>
          <span>15+ Years</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: porscheFont
        ? [
            {
              name: '911Porsche',
              data: porscheFont,
              style: 'normal',
              weight: 400,
            },
          ]
        : undefined,
    },
  );
}
