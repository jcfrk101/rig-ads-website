// Fire-and-forget beacon: persist this ad click's ID server-side (ad_click
// collection) so calls can later be joined to clicks — the gclid otherwise
// lives only in this browser's sessionStorage and a phone call carries no
// click ID. sendBeacon with a text/plain body is a "simple" CORS request
// (no preflight, opaque response) and survives page unload.
const API = 'https://api.bigrig.app'

export function logAdClick(): void {
  try {
    const p = new URLSearchParams(window.location.search)
    const kind = (['gclid', 'gbraid', 'wbraid'] as const).find((k) => p.get(k))
    if (!kind || typeof navigator.sendBeacon !== 'function') return
    const id = p.get(kind) as string
    // one beacon per click id per tab-session — reloads and back-forward don't re-log
    const key = `rig-click-logged:${id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    const state = window.location.pathname.match(/^\/semi-truck-repair\/([a-z]{2})(?:\/|$)/)?.[1] ?? null
    const body = JSON.stringify({
      click_id: id,
      click_kind: kind,
      page: window.location.pathname,
      state,
      loc: p.get('loc'),
      int: p.get('int'),
    })
    navigator.sendBeacon(`${API}/ad/click`, new Blob([body], { type: 'text/plain' }))
  } catch {
    // never let telemetry touch the page
  }
}
