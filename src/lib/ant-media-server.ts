import https from 'node:https'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

export interface AntMediaBroadcast {
  streamId: string
  name: string
  status: 'broadcasting' | 'created' | 'finished'
  viewerCount: number
  hlsViewerCount: number
  webRTCViewerCount: number
  rtmpViewerCount: number
  date: number
  startTime: number
  duration: number
  description: string
  category: string
  type: string
  metaData: string
}

// Cache model stream IDs for 60s — role changes are infrequent, no need to hit
// Supabase on every 5-second poll cycle.
let _modelCacheIds: Set<string> = new Set()
let _modelCacheExpiry = 0

export async function fetchModelStreamIds(): Promise<Set<string>> {
  const now = Date.now()
  if (now < _modelCacheExpiry) return _modelCacheIds

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'model')

    _modelCacheIds = new Set(
      (data ?? []).map((p: { id: string }) => `host-${p.id.slice(0, 12)}`)
    )
  } catch {
    // On error, return the last known set (or empty on first call)
  }

  _modelCacheExpiry = now + 60_000
  return _modelCacheIds
}

/** Derives the REST base URL from the WebSocket URL in env */
export function getAntMediaRestUrl(): string {
  const wsUrl = process.env.NEXT_PUBLIC_ANT_MEDIA_URL
  if (!wsUrl) return ''
  // wss://host:port/AppName/websocket → https://host:port/AppName
  return wsUrl.replace(/^wss?:\/\//, 'https://').replace(/\/websocket$/, '')
}

/** Generates a short-lived HS256 JWT for Ant Media REST API authentication */
function generateJwt(secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(JSON.stringify({ sub: 'token', iat: now, exp: now + 3600 })).toString('base64url')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${signature}`
}

/** Fetches from Ant Media REST API, bypassing self-signed SSL certificates */
export function antMediaFetch(
  path: string,
  options: { method?: string } = {}
): Promise<{ ok: boolean; status: number; text: string }> {
  const baseUrl = getAntMediaRestUrl()
  if (!baseUrl) return Promise.resolve({ ok: false, status: 500, text: '' })

  const url = new URL(`${baseUrl}/rest${path}`)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  const jwtSecret = process.env.ANT_MEDIA_JWT_SECRET
  if (jwtSecret) {
    headers['Authorization'] = `Bearer ${generateJwt(jwtSecret)}`
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: parseInt(url.port) || 443,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers,
        rejectUnauthorized: false, // Required for self-signed certs on private AntMedia servers
      },
      (res) => {
        let text = ''
        res.on('data', (chunk) => { text += chunk })
        res.on('end', () => resolve({ ok: (res.statusCode || 0) < 400, status: res.statusCode || 0, text }))
      }
    )
    req.on('error', reject)
    req.end()
  })
}

/** Fetches the raw bytes of a thumbnail image from Ant Media */
export function antMediaFetchImage(streamId: string): Promise<{ ok: boolean; buffer: Buffer; contentType: string }> {
  const baseUrl = getAntMediaRestUrl()
  if (!baseUrl) return Promise.resolve({ ok: false, buffer: Buffer.alloc(0), contentType: 'image/png' })

  const url = new URL(`${baseUrl}/streams/${streamId}.png`)

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: parseInt(url.port) || 443,
        path: url.pathname,
        method: 'GET',
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        res.on('end', () =>
          resolve({
            ok: (res.statusCode || 0) < 400,
            buffer: Buffer.concat(chunks),
            contentType: (res.headers['content-type'] as string) || 'image/png',
          })
        )
      }
    )
    req.on('error', reject)
    req.end()
  })
}
