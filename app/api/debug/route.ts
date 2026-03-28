import { NextResponse } from 'next/server'
import { antMediaFetch, getAntMediaRestUrl } from '@/lib/ant-media-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const base = getAntMediaRestUrl()
  const results: Record<string, unknown> = {
    antMediaBase: base,
    jwtSecretSet: !!process.env.ANT_MEDIA_JWT_SECRET,
    timestamp: new Date().toISOString(),
  }

  // 1. Check REST API connectivity
  try {
    const res = await antMediaFetch('/v2/broadcasts/list/0/10')
    results.restApi = { status: res.status, ok: res.ok }

    if (res.ok && res.text) {
      const streams = JSON.parse(res.text)
      results.liveStreams = streams
        .filter((s: any) => s.status === 'broadcasting')
        .map((s: any) => ({ streamId: s.streamId, name: s.name, status: s.status }))
    }
  } catch (e: any) {
    results.restApi = { error: e.message }
  }

  // 2. Check HLS for each live stream
  if (Array.isArray(results.liveStreams) && results.liveStreams.length > 0) {
    const hlsChecks: Record<string, unknown>[] = []
    for (const stream of results.liveStreams as any[]) {
      try {
        const hlsRes = await antMediaFetch(`/../streams/${stream.streamId}.m3u8`)
        hlsChecks.push({ streamId: stream.streamId, status: hlsRes.status, ok: hlsRes.ok, bodyLength: hlsRes.text.length })
      } catch (e: any) {
        hlsChecks.push({ streamId: stream.streamId, error: e.message })
      }
    }
    results.hlsChecks = hlsChecks
  }

  return NextResponse.json(results, { status: 200 })
}
