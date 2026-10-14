import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const LOGO = 'https://files.catbox.moe/52pvkc.png'
const DIR = 'public/icons'
mkdirSync(DIR, { recursive: true })

const table = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = table[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size) {
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size
      const d = Math.hypot(u - 0.5, v - 0.5)
      let r = 3 + 10 * (1 - d * 1.6), g = 5 + 18 * (1 - d * 1.6), b = 10 + 36 * (1 - d * 1.6)
      const ring = Math.abs(d - 0.38) < 0.018
      const t = (v - 0.3) / 0.4
      const chev = t >= 0 && t <= 1 && (Math.abs(u - (0.5 - 0.22 * (1 - t))) < 0.034 || Math.abs(u - (0.5 + 0.22 * (1 - t))) < 0.034)
      if (ring || chev) { r = 79; g = 216; b = 255 }
      const o = y * stride + 1 + x * 4
      raw[o] = Math.max(0, Math.min(255, r)); raw[o + 1] = Math.max(0, Math.min(255, g)); raw[o + 2] = Math.max(0, Math.min(255, b)); raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

async function fromLogo() {
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 8000)
    const res = await fetch(LOGO, { signal: ctl.signal })
    clearTimeout(timer)
    if (!res.ok || !(res.headers.get('content-type') || '').startsWith('image/')) return false
    const buf = Buffer.from(await res.arrayBuffer())
    for (const n of ['icon-192.png', 'icon-512.png']) writeFileSync(`${DIR}/${n}`, buf)
    return true
  } catch { return false }
}

if (!(await fromLogo())) {
  for (const [n, s] of [['icon-192.png', 192], ['icon-512.png', 512]]) if (!existsSync(`${DIR}/${n}`)) writeFileSync(`${DIR}/${n}`, png(s))
}
