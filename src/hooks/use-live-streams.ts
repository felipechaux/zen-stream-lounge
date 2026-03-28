'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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

export function useLiveStreams() {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const esRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    // Close any existing connection
    if (esRef.current) esRef.current.close()

    const es = new EventSource('/api/streams/events')
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setStreams((data.streams as AntMediaBroadcast[]).map(mapBroadcast))
        setCount(data.count ?? 0)
        setError(null)
        setLastUpdated(new Date())
      } catch (_) {}
      setLoading(false)
    }

    es.onerror = () => {
      setError('Reconnecting…')
      // EventSource will auto-reconnect; just update status
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => esRef.current?.close()
  }, [connect])

  const refetch = useCallback(() => {
    setLoading(true)
    connect()
  }, [connect])

  return { streams, count, loading, error, lastUpdated, refetch }
}
