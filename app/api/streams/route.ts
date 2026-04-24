import { NextResponse } from 'next/server'
import { antMediaFetch, fetchModelStreamIds, AntMediaBroadcast } from '@/lib/ant-media-server'

export async function GET() {
  try {
    const [listRes, modelIds] = await Promise.all([
      antMediaFetch('/v2/broadcasts/list/0/50'),
      fetchModelStreamIds(),
    ])

    let streams: AntMediaBroadcast[] = []

    if (listRes.ok && listRes.text) {
      const all: AntMediaBroadcast[] = JSON.parse(listRes.text)
      streams = all.filter((b) => b.status === 'broadcasting' && modelIds.has(b.streamId))
    }

    return NextResponse.json({ streams, count: streams.length })
  } catch (err) {
    console.error('[/api/streams] Failed to fetch from Ant Media:', err)
    return NextResponse.json({ streams: [], count: 0 })
  }
}
