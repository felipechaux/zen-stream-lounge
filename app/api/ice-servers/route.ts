import { NextResponse } from 'next/server'

export async function GET() {
  const iceServers: RTCIceServer[] = [
    // STUN fallbacks
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]

  const turnUrl = process.env.TURN_URL
  const turnUsername = process.env.TURN_USERNAME
  const turnPassword = process.env.TURN_PASSWORD

  if (turnUrl && turnUsername && turnPassword) {
    // Custom TURN server (Ant Media, Twilio, Xirsys, etc.)
    iceServers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnPassword,
    })
  } else {
    // Open Relay — free public TURN, works without own server
    iceServers.push(
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turns:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    )
  }

  return NextResponse.json({ iceServers })
}
