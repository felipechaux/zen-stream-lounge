import { NextRequest, NextResponse } from 'next/server'
import https from 'node:https'

export const dynamic = 'force-dynamic'

/** Makes an HTTPS GET request to Ant Media, ignoring self-signed certs */
function antMediaGet(url: string): Promise<{ status: number; contentType: string; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parseInt(parsed.port) || 443,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        res.on('end', () =>
          resolve({
            status: res.statusCode || 0,
            contentType: (res.headers['content-type'] as string) || 'application/octet-stream',
            body: Buffer.concat(chunks),
          })
        )
      }
    )
    req.on('error', reject)
    req.end()
  })
}

function getAntMediaBase(): string {
  const ws = process.env.NEXT_PUBLIC_ANT_MEDIA_URL || ''
  return ws.replace(/^wss?:\/\//, 'https://').replace(/\/websocket$/, '')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filePath = path.join('/')
  const upstreamUrl = `${getAntMediaBase()}/streams/${filePath}`

  let result: { status: number; contentType: string; body: Buffer }
  try {
    result = await antMediaGet(upstreamUrl)
  } catch (err) {
    console.error('[HLS proxy] fetch error:', err)
    return new NextResponse('Upstream unreachable', { status: 502 })
  }

  if (result.status === 404) {
    return new NextResponse('Stream not found', { status: 404 })
  }

  if (result.status >= 400) {
    return new NextResponse('Upstream error', { status: result.status })
  }

  // M3U8 manifest — rewrite all segment/playlist URLs to go through this proxy
  if (filePath.endsWith('.m3u8')) {
    const text = result.body.toString('utf-8')
    const proxyBase = new URL(request.url).origin + '/api/streams/hls'

    const rewritten = text
      .split('\n')
      .map((line) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) return line

        // Absolute URL pointing to Ant Media
        if (trimmed.startsWith('http')) {
          try {
            const u = new URL(trimmed)
            // Extract just the filename part after /streams/
            const file = u.pathname.split('/streams/')[1] || u.pathname.split('/').pop()
            return `${proxyBase}/${file}`
          } catch {
            return line
          }
        }

        // Relative URL (just filename like stream001.ts or sub.m3u8)
        return `${proxyBase}/${trimmed}`
      })
      .join('\n')

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  // Binary segments (.ts, .fmp4, etc.) — pass through directly
  return new NextResponse(result.body, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=10',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
