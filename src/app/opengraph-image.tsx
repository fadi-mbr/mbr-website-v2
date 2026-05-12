import { ImageResponse } from 'next/og';

export const alt =
  'MBR Auto Services. Independent luxury and exotic-car workshop in Dubai.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Dynamic 1200×630 social preview.
 *
 * Wordmark, tagline and credentials render in Fraunces serif (editorial
 * brand voice). The previous 911Porsche stencil face was retired — it
 * read as racing-game HUD when projected to a social preview thumbnail.
 *
 * Fraunces is fetched live from Google Fonts at request time and
 * embedded into the ImageResponse, so the page itself doesn't have to
 * ship the font for the OG endpoint to render correctly.
 */
export default async function OpenGraphImage() {
  // Fetch Fraunces (light + regular weights, latin subset) from Google
  // Fonts and embed into the response. Fail-soft to the system serif
  // fallback if the fetch fails for any reason.
  let fraunces300: ArrayBuffer | null = null;
  let fraunces400: ArrayBuffer | null = null;
  try {
    const cssRes = await fetch(
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&display=swap',
      {
        headers: {
          // Trick Google into serving WOFF/TTF instead of WOFF2 so the
          // raw ttf URL is in the CSS response.
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/600 Safari/600',
        },
      },
    );
    const css = await cssRes.text();
    const ttfUrls = [...css.matchAll(/url\((https:\/\/[^)]+\.ttf)\)/g)].map(
      (m) => m[1],
    );
    if (ttfUrls.length >= 1) {
      fraunces300 = await (await fetch(ttfUrls[0])).arrayBuffer();
    }
    if (ttfUrls.length >= 2) {
      fraunces400 = await (await fetch(ttfUrls[1])).arrayBuffer();
    }
  } catch {
    /* fall through to system fallback */
  }

  const brandFont = fraunces400 || fraunces300 ? 'Fraunces' : 'Georgia, serif';

  const customFonts = [
    ...(fraunces300
      ? [
          {
            name: 'Fraunces' as const,
            data: fraunces300,
            style: 'normal' as const,
            weight: 300 as const,
          },
        ]
      : []),
    ...(fraunces400
      ? [
          {
            name: 'Fraunces' as const,
            data: fraunces400,
            style: 'normal' as const,
            weight: 400 as const,
          },
        ]
      : []),
  ];

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

        {/* Wordmark — Fraunces serif */}
        <div
          style={{
            fontFamily: brandFont,
            fontSize: 216,
            fontWeight: 300,
            letterSpacing: -6,
            lineHeight: 0.95,
            display: 'flex',
            color: 'white',
          }}
        >
          MBR
        </div>

        {/* Sub-wordmark — small caps Geist/sans bronze */}
        <div
          style={{
            fontFamily: 'sans-serif',
            fontSize: 22,
            letterSpacing: 12,
            textTransform: 'uppercase',
            color: '#A57842',
            marginTop: 18,
            fontWeight: 500,
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

        {/* Tagline — Fraunces serif, lowercase for editorial pull */}
        <div
          style={{
            fontFamily: brandFont,
            fontSize: 44,
            fontWeight: 300,
            color: '#e5e5e5',
            textAlign: 'center',
            maxWidth: 920,
            lineHeight: 1.2,
            letterSpacing: -0.8,
          }}
        >
          Independent Luxury &amp; Exotic-Car Workshop
        </div>

        {/* Location — small caps sans */}
        <div
          style={{
            fontFamily: 'sans-serif',
            fontSize: 18,
            fontWeight: 500,
            color: '#a1a1aa',
            marginTop: 24,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          Al Quoz Industrial 4 · Dubai · UAE
        </div>

        {/* Credentials strip — sans uppercase tracked */}
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
            fontFamily: 'sans-serif',
            fontSize: 18,
            fontWeight: 500,
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
      // `fonts` MUST contain at least one entry, or ImageResponse refuses
      // to lay out. Omit the key entirely when the Google Fonts fetch
      // failed at build time — next/og then falls back to its bundled
      // sans, which still produces a valid (less branded) preview.
      ...(customFonts.length > 0 ? { fonts: customFonts } : {}),
    },
  );
}
