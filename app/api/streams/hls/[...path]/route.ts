import { NextRequest, NextResponse } from 'next/server'
import https from 'node:https'

const agent = new https.Agent({ rejectUnauthorized: false })

/** Derives the Ant Media base URL (https://host:port/App) from env */
function getAntMediaBase(): string {
  const ws = process.env.NEXT_PUBLIC_ANT_MEDIA_URL || ''
  return ws.replace(/^wss?:\/\//, 'https://').replace(/\/websocket$/, '')
}

async function fetchFromAntMedia(path: string): Promise<Response> {
  const url = `${getAntMediaBase()}/streams/${path}`
  return fetch(url, { agent } as RequestInit)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filePath = path.join('/')
  const upstream = await fetchFromAntMedia(filePath)

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status })
  }

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream'

  // For M3U8 manifests, rewrite internal URLs so segments also go through this proxy
  if (filePath.endsWith('.m3u8')) {
    const text = await upstream.text()
    const proxyBase = new URL(request.url).origin + '/api/streams/hls'

    const rewritten = text
      .split('\n')
      .map(line => {
        const trimmed = line.trim()
        // Rewrite segment and sub-manifest references (not comment lines)
        if (trimmed && !trimmed.startsWith('#')) {
          // Already an absolute URL pointing to Ant Media → replace with proxy
          if (trimmed.startsWith('http')) {
            const url = new URL(trimmed)
            return `${proxyBase}${url.pathname.replace(/.*\/streams\//, '/')}`
          }
          // Relative URL → prepend proxy base
          return `${proxyBase}/${trimmed}`
        }
        return line
      })
      .join('\n')

    return new NextResponse(rewritten, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  // For .ts segments and other binary files, stream through directly
  const buffer = await upstream.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=10',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
