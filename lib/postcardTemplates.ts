import type { NicheConfig } from './niches'
import type { Profile, Property } from '@/types'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function optOutUrl(slug: string | null): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return slug ? `${base}/p/${slug}/optout` : `${base}/optout`
}

function roiLabel(p: Property): string {
  if (!p.roi_estimate_low || !p.roi_estimate_high) return ''
  const low = Math.round(p.roi_estimate_low / 1000)
  const high = Math.round(p.roi_estimate_high / 1000)
  return `Est. value: $${low}K–$${high}K`
}

const SHARED_STYLES = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"DM Sans",Arial,sans-serif;width:1872px;height:1296px;overflow:hidden;color:#0F172A}
h1{font-family:"Bricolage Grotesque",Arial;font-weight:700;line-height:1.15}
`

export function buildFrontHTML(
  property: Property,
  profile: Profile,
  niche: NicheConfig,
): string {
  const hi = property.owner_first ? `Hi ${esc(property.owner_first)},` : ''
  const hero = property.render_url ?? property.satellite_url ?? ''
  const roi = roiLabel(property)
  const qr = property.qr_code_url

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${SHARED_STYLES}
.img{position:absolute;left:0;top:0;width:55%;height:100%;object-fit:cover}
.copy{position:absolute;right:0;top:0;width:45%;height:100%;background:#fff;display:flex;flex-direction:column;justify-content:center;padding:60px 50px}
h1{font-size:36px;color:#1E1B4B}
.sub{font-size:20px;color:#4F46E5;font-weight:500;margin-top:10px}
.co{font-size:16px;color:#64748B;margin-bottom:18px}
.hi{font-size:16px;color:#374151;margin-top:14px}
.roi{font-size:18px;color:#16A34A;font-weight:600;margin-top:22px}
.qr{margin-top:28px;display:flex;align-items:center;gap:18px}
.qr img{width:100px;height:100px}
.cta{font-size:15px;color:#4F46E5;font-weight:600}
.ctasub{font-size:13px;color:#64748B;margin-top:3px}
.disc{position:absolute;bottom:16px;left:55%;right:0;font-size:8px;color:#9CA3AF;line-height:1.4;padding:0 50px}
</style></head><body>
<img class="img" src="${esc(hero)}" />
<div class="copy">
  <div class="co">${esc(profile.company_name)}</div>
  <h1>${esc(niche.postcard_headline)}</h1>
  <div class="sub">${esc(niche.postcard_subheadline)}</div>
  ${hi ? `<div class="hi">${hi} see what's possible.</div>` : ''}
  ${roi ? `<div class="roi">${roi}</div>` : ''}
  ${qr ? `<div class="qr"><img src="${esc(qr)}" /><div>
    <div class="cta">${esc(niche.postcard_cta)}</div>
    <div class="ctasub">See your personalized preview →</div>
  </div></div>` : `<div class="qr"><div>
    <div class="cta">${esc(niche.postcard_cta)}</div>
    <div class="ctasub">Visit our site for your personalized preview.</div>
  </div></div>`}
</div>
<div class="disc">AI-generated rendering for illustration purposes only — not a photo of completed work.
Estimated values based on national averages. Actual results vary.
To stop receiving mail: ${esc(optOutUrl(property.landing_slug))} · Property data from public county records.</div>
</body></html>`
}

export function buildBackHTML(
  property: Property,
  profile: Profile,
  niche: NicheConfig,
): string {
  const benefits = niche.landing_benefits.slice(0, 3)
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${SHARED_STYLES}
.wrap{padding:80px 70px;display:flex;flex-direction:column;height:100%;gap:28px}
.brand{font-family:"Bricolage Grotesque",Arial;font-size:28px;font-weight:700;color:#1E1B4B}
.tag{font-size:16px;color:#64748B;margin-top:2px}
h2{font-family:"Bricolage Grotesque",Arial;font-size:32px;font-weight:700;color:#0F172A;margin-top:6px}
.stat{display:inline-block;background:#EEF2FF;color:#4F46E5;font-weight:600;padding:8px 14px;border-radius:999px;font-size:14px;margin-top:8px}
ul{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:4px}
li{font-size:16px;color:#334155;display:flex;gap:10px;align-items:flex-start}
li::before{content:"✓";color:#16A34A;font-weight:700}
.contact{margin-top:auto;border-top:1px solid #E2E8F0;padding-top:20px;display:flex;justify-content:space-between;gap:30px;font-size:13px;color:#475569;line-height:1.5}
.ret{font-size:11px;color:#94A3B8;margin-top:12px}
.opt{font-size:9px;color:#9CA3AF;margin-top:6px;line-height:1.4}
</style></head><body>
<div class="wrap">
  <div>
    <div class="brand">${esc(profile.company_name)}</div>
    <div class="tag">${esc(niche.label)} specialist</div>
  </div>
  <div>
    <h2>${esc(niche.landing_hero)}</h2>
    <div class="stat">${esc(niche.postcard_stat)}</div>
  </div>
  <ul>
    ${benefits.map((b) => `<li>${esc(b)}</li>`).join('')}
  </ul>
  <div class="contact">
    <div>
      ${profile.phone ? `<div><strong>Call:</strong> ${esc(profile.phone)}</div>` : ''}
      ${profile.website ? `<div><strong>Web:</strong> ${esc(profile.website)}</div>` : ''}
      ${profile.email ? `<div><strong>Email:</strong> ${esc(profile.email)}</div>` : ''}
    </div>
    <div class="ret">
      <strong>${esc(profile.company_name)}</strong><br/>
      ${esc(profile.return_address)}<br/>
      ${esc(profile.return_city)}, ${esc(profile.return_state)} ${esc(profile.return_zip)}
    </div>
  </div>
  <div class="opt">
    To stop receiving mail from ${esc(profile.company_name)}: ${esc(optOutUrl(property.landing_slug))}
  </div>
</div>
</body></html>`
}
