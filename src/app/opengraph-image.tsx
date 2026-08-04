import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          background: '#0f1215',
          color: '#e8eaed',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -1 }}>Fonte Pública</div>
        <div style={{ marginTop: 24, fontSize: 32, color: '#9aa3ad', maxWidth: 900 }}>
          Radar de licitações e contratos públicos — PNCP
        </div>
        <div
          style={{
            marginTop: 48,
            height: 4,
            width: 180,
            background: '#c4a35a',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
