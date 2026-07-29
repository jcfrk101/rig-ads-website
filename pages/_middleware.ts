import { NextRequest, NextResponse } from 'next/server'

// Canonical host: apex only. The LB forwards the original Host header, so
// www.bigrig.app requests reach this service directly — 301 them to the apex
// (the marketing site already does this for its own routes). Non-www hosts
// (apex, *.run.app, localhost) pass through untouched.
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  if (host.startsWith('www.')) {
    const url = req.nextUrl.clone()
    url.protocol = 'https:'
    url.host = host.slice(4)
    url.port = ''
    return NextResponse.redirect(url, 301)
  }
  return NextResponse.next()
}
