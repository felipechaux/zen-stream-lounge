import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/webhooks/ant-media
 *
 * Receives real-time stream lifecycle events from AntMedia Server.
 * Configure this URL in AntMedia → Settings → Webhooks:
 *   https://your-domain/api/webhooks/ant-media
 *
 * Available actions (from AntMedia docs):
 *   liveStreamStarted  — stream began publishing
 *   liveStreamEnded    — stream stopped publishing
 *   vodReady           — VOD recording is ready
 *   publishStarted     — publisher connected (before stream is live)
 *   publishFinished    — publisher disconnected
 *
 * For private 1-to-1 calls we care about liveStreamStarted/Ended on
 * streams matching the pattern:  priv-{streamId}-host
 */
export async function POST(req: Request) {
  let body: { action?: string; streamId?: string; streamName?: string } = {}

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action, streamId } = body
  console.log(`[AntMedia Webhook] action=${action} streamId=${streamId}`)

  // Handle private call stream events
  if (streamId && (action === 'liveStreamStarted' || action === 'liveStreamEnded')) {
    const hostMatch = streamId.match(/^priv-(.+)-host$/)

    if (hostMatch) {
      const callStreamId = hostMatch[1]
      await handlePrivateCallStreamEvent(callStreamId, action === 'liveStreamStarted')
    }
  }

  return NextResponse.json({ received: true })
}

async function handlePrivateCallStreamEvent(callStreamId: string, isLive: boolean) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    console.warn('[AntMedia Webhook] SUPABASE_SERVICE_ROLE_KEY not set — skipping DB update')
    return
  }

  // Use service role to bypass RLS
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  if (isLive) {
    // Mark the accepted call request so the viewer knows the host stream is ready
    await supabase
      .from('call_requests')
      .update({ status: 'streaming' })
      .eq('stream_id', callStreamId)
      .eq('status', 'accepted')
  } else {
    // Host stream ended — end the active call
    await supabase
      .from('call_requests')
      .update({ status: 'ended' })
      .eq('stream_id', callStreamId)
      .in('status', ['accepted', 'streaming'])
  }
}
