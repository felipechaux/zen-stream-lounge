import { NextResponse } from 'next/server'
import { antMediaFetchImage } from '@/lib/ant-media-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await params

  try {
    const { ok, buffer, contentType } = await antMediaFetchImage(streamId)

    if (!ok || buffer.length === 0) {
      return new NextResponse(null, { status: 404 })
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=10', // Thumbnails update ~every 10s while live
      },
    })
  } catch (err) {
    console.error(`[thumbnail/${streamId}] Failed:`, err)
    return new NextResponse(null, { status: 500 })
  }
}
