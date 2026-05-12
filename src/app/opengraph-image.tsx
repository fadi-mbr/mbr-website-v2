import { ImageResponse } from 'next/og';

export const alt =
  'MBR Auto Services. Independent luxury and exotic-car workshop in Dubai.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
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

        {/* Wordmark */}
        <div
          style={{
            fontSize: 184,
            fontWeight: 700,
            letterSpacing: -8,
            lineHeight: 1,
            display: 'flex',
          }}
        >
          <span style={{ color: 'white' }}>MBR</span>
        </div>

        {/* Sub-wordmark */}
        <div
          style={{
            fontSize: 28,
            letterSpacing: 12,
            textTransform: 'uppercase',
            color: '#A57842',
            marginTop: 12,
          }}
        >
          Making Better Rides
        </div>

        {/* Divider */}
        <div
          style={{
            width: 120,
            height: 2,
            background: '#E30613',
            marginTop: 40,
            marginBottom: 32,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 38,
            fontWeight: 300,
            color: '#e5e5e5',
            textAlign: 'center',
            maxWidth: 880,
            lineHeight: 1.25,
          }}
        >
          Independent Luxury &amp; Exotic-Car Workshop
        </div>

        {/* Location */}
        <div
          style={{
            fontSize: 22,
            color: '#a1a1aa',
            marginTop: 18,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Al Quoz Industrial 4 · Dubai · UAE
        </div>

        {/* Bottom credentials strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 36,
            fontSize: 20,
            color: '#d4d4d8',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          <span>Bosch Authorised</span>
          <span style={{ color: '#E30613' }}>·</span>
          <span>Leonardo Diagnostics</span>
          <span style={{ color: '#E30613' }}>·</span>
          <span>15+ Years</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
