'use client'

import { useEffect, useState, useCallback } from 'react'
import type { AntMediaBroadcast } from '@/lib/ant-media-server'

export interface LiveStream {
  streamId: string
  name: string
  viewers: number
  thumbnailUrl: string
  startTime: number
  duration: number
}

function mapBroadcast(b: AntMediaBroadcast): LiveStream {
  return {
    streamId: b.streamId,
    name: b.name || b.streamId,
    viewers: (b.webRTCViewerCount || 0) + (b.hlsViewerCount || 0) + (b.rtmpViewerCount || 0),
    thumbnailUrl: `/api/streams/thumbnail/${b.streamId}`,
    startTime: b.startTime || b.date || 0,
    duration: b.duration || 0,
  }
}

export function useLiveStreams(pollInterval = 30_000) {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch('/api/streams')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStreams((data.streams as AntMediaBroadcast[]).map(mapBroadcast))
      setCount(data.count ?? 0)
      setError(null)
    } catch (e) {
      setError('Unable to reach streaming server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStreams()
    const id = setInterval(fetchStreams, pollInterval)
    return () => clearInterval(id)
  }, [fetchStreams, pollInterval])

  return { streams, count, loading, error, refetch: fetchStreams }
}
