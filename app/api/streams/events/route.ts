import { antMediaFetch, AntMediaBroadcast } from '@/lib/ant-media-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const POLL_INTERVAL_MS = 5000

async function fetchLiveStreams(): Promise<{ streams: AntMediaBroadcast[]; count: number }> {
  try {
    const [listRes, countRes] = await Promise.all([
      antMediaFetch('/v2/broadcasts/list/0/50'),
      antMediaFetch('/v2/broadcasts/active-live-stream-count'),
    ])

    let streams: AntMediaBroadcast[] = []
    let count = 0

    if (listRes.ok && listRes.text) {
      const all: AntMediaBroadcast[] = JSON.parse(listRes.text)
      streams = all.filter((b) => b.status === 'broadcasting')
    }

    count = countRes.ok && countRes.text
      ? parseInt(countRes.text, 10) || streams.length
      : streams.length

    return { streams, count }
  } catch {
    return { streams: [], count: 0 }
  }
}

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (_) {}
      }

      // Send initial state immediately
      const initial = await fetchLiveStreams()
      send(initial)

      let lastSnapshot = JSON.stringify(initial.streams.map(s => s.streamId).sort())

      // Keep polling and only push when something changes
      while (true) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))

        let result: { streams: AntMediaBroadcast[]; count: number }
        try {
          result = await fetchLiveStreams()
        } catch {
          break
        }

        const snapshot = JSON.stringify(result.streams.map(s => s.streamId).sort())
        if (snapshot !== lastSnapshot) {
          lastSnapshot = snapshot
          send(result)
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
