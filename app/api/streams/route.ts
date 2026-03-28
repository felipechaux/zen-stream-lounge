import { NextResponse } from 'next/server'
import { antMediaFetch, AntMediaBroadcast } from '@/lib/ant-media-server'

export async function GET() {
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

    if (countRes.ok && countRes.text) {
      count = parseInt(countRes.text, 10) || streams.length
    } else {
      count = streams.length
    }

    return NextResponse.json({ streams, count })
  } catch (err) {
    console.error('[/api/streams] Failed to fetch from Ant Media:', err)
    return NextResponse.json({ streams: [], count: 0 })
  }
}
