import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default async function Icon() {
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
        }}
      >
        <div
          style={{
            fontSize: 20,
            color: '#E30613',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            letterSpacing: '1px',
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