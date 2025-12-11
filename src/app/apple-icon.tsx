import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default async function AppleIcon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20px',
        }}
      >
        <div
          style={{
            fontSize: 64,
            color: '#E30613',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            letterSpacing: '2px',
          }}
        >
          MBR
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}