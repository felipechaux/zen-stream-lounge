import { NextResponse } from 'next/server'
import { antMediaFetch } from '@/lib/ant-media-server'

/**
 * GET /api/streams/[streamId]/live
 * Returns whether a specific AntMedia stream is currently broadcasting.
 * Used by the 1-to-1 call components to wait for the remote peer to start
 * publishing before attempting to play.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await params

  if (!streamId) {
    return NextResponse.json({ live: false, status: 'unknown' }, { status: 400 })
  }

  try {
    const res = await antMediaFetch(`/v2/broadcasts/${encodeURIComponent(streamId)}`)

    if (!res.ok || !res.text) {
      return NextResponse.json({ live: false, status: 'not_found' })
    }

    const broadcast = JSON.parse(res.text)
    const live = broadcast?.status === 'broadcasting'

    return NextResponse.json({
      live,
      status: broadcast?.status ?? 'unknown',
      viewerCount: broadcast?.webRTCViewerCount ?? 0,
    })
  } catch (err) {
    console.error(`[/api/streams/${streamId}/live]`, err)
    return NextResponse.json({ live: false, status: 'error' })
  }
}
