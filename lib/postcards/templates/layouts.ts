// Front: stacked BEFORE/AFTER images on the left, copy + QR panel on the right.
// Sized in pixels to match the 1872x1296 preview iframe at 300 DPI.
export function buildFrontTemplate(accent: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page { size: 9in 6in; margin: 0; }
body { font-family: 'DM Sans', 'Helvetica', Arial, sans-serif; width: 1872px; height: 1296px; overflow: hidden; color: #0F172A; }
.front { position: relative; width: 100%; height: 100%; display: flex; }

.images { position: relative; width: 64%; height: 100%; display: flex; flex-direction: column; background: #0F172A; }
.img-pane { position: relative; width: 100%; height: 50%; overflow: hidden; }
.img-pane img { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-pane.after-empty {
  background: linear-gradient(135deg, ${accent}22, ${accent}55);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 28px; font-weight: 700; letter-spacing: 1px; text-align: center; padding: 40px;
}
.h-divider { position: absolute; top: 50%; left: 0; right: 0; height: 6px; background: #fff; transform: translateY(-3px); z-index: 10; }
.label {
  position: absolute; top: 28px; left: 28px;
  background: rgba(0,0,0,0.78); color: #fff;
  padding: 10px 22px; border-radius: 6px;
  font-size: 22px; font-weight: 800; letter-spacing: 2px;
  text-transform: uppercase;
}
.after-label { background: ${accent}; }
.ai-disclaimer {
  position: absolute; bottom: 22px; right: 22px;
  font-size: 14px; color: #fff;
  background: rgba(0,0,0,0.55); padding: 6px 12px; border-radius: 4px;
}

.copy { width: 36%; height: 100%; background: #fff; display: flex; flex-direction: column; justify-content: center; padding: 56px 50px; position: relative; }
.brand { font-size: 18px; color: #64748B; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 18px; }
h1 { font-size: 44px; font-weight: 800; line-height: 1.1; color: #0F172A; margin-bottom: 18px; }
.sub { font-size: 22px; color: ${accent}; font-weight: 600; margin-bottom: 22px; line-height: 1.3; }
.hi { font-size: 18px; color: #334155; margin-bottom: 22px; line-height: 1.4; }
.roi { background: ${accent}; color: #fff; padding: 18px 22px; border-radius: 10px; margin-bottom: 24px; }
.roi-lbl { font-size: 12px; letter-spacing: 1.4px; text-transform: uppercase; opacity: 0.9; margin-bottom: 4px; }
.roi-val { font-size: 26px; font-weight: 800; }
.qr-row { display: flex; align-items: center; gap: 28px; }
.qr-row .qr-svg { width: 130px; height: 130px; flex-shrink: 0; }
.qr-row .qr-svg svg { width: 100%; height: 100%; }
.qr-text .cta { font-size: 18px; color: ${accent}; font-weight: 700; line-height: 1.25; margin-bottom: 6px; }
.qr-text .cta-sub { font-size: 14px; color: #64748B; line-height: 1.4; }
</style>
</head>
<body>
<div class="front">
  <div class="images">
    {{before_pane_html}}
    <div class="h-divider"></div>
    {{after_pane_html}}
  </div>
  <div class="copy">
    <div class="brand">{{contractor_company_name}}</div>
    <h1>{{headline}}</h1>
    <div class="sub">{{subheadline}}</div>
    <div class="hi">Hi {{owner_first_name}}, here's what's possible at {{property_street}}.</div>
    <div class="roi">
      <div class="roi-lbl">Estimated value lift</div>
      <div class="roi-val">{{value_add_low}} – {{value_add_high}}</div>
    </div>
    <div class="qr-row">
      <div class="qr-svg">{{qr_code_svg}}</div>
      <div class="qr-text">
        <div class="cta">{{cta_text}}</div>
        <div class="cta-sub">Scan for your personalized preview</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`
}

export function buildBackTemplate(accent: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
@page { size: 9in 6in; margin: 0; }
body { margin: 0; font-family: 'Helvetica', Arial, sans-serif; width: 9in; height: 6in; color: #222; position: relative; }
.back { display: grid; grid-template-columns: 5.5in 3.5in; height: 100%; }
.left { padding: 0.35in 0.35in 0.55in; display: flex; flex-direction: column; }
.right { padding: 0.35in; background: #f5f5f0; display: flex; flex-direction: column; justify-content: space-between; }
.greeting { font-size: 14px; color: #666; margin-bottom: 6px; }
.name { font-size: 28px; font-weight: 800; color: ${accent}; margin-bottom: 16px; line-height: 1.1; }
.body-copy { font-size: 13px; line-height: 1.55; color: #333; margin-bottom: 16px; }
.roi-box { background: ${accent}; color: #fff; padding: 14px 18px; border-radius: 8px; margin-bottom: 14px; }
.roi-label { font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; opacity: 0.85; margin-bottom: 4px; }
.roi-value { font-size: 22px; font-weight: 800; }
.roi-sub { font-size: 11px; opacity: 0.9; margin-top: 4px; }
.cta-bar { background: #222; color: #fff; padding: 14px 16px; border-radius: 6px; text-align: center; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; }
.qr-section { text-align: center; }
.qr-section svg { width: 1.5in; height: 1.5in; display: block; margin: 0 auto 8px; }
.qr-label { font-size: 10px; color: #666; line-height: 1.4; }
.contractor { font-size: 11px; line-height: 1.45; color: #444; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px; }
.contractor-name { font-weight: 700; font-size: 12px; color: #222; margin-bottom: 3px; }
.disclaimers { font-size: 7px; color: #888; line-height: 1.35; position: absolute; bottom: 0.12in; left: 0.35in; right: 3.85in; }
</style>
</head>
<body>
<div class="back">
  <div class="left">
    <div class="greeting">Hello from {{contractor_company_name}},</div>
    <div class="name">{{owner_first_name}}</div>
    <div class="body-copy">{{body_copy}}</div>
    <div class="roi-box">
      <div class="roi-label">Projects Like This Typically Add</div>
      <div class="roi-value">{{value_add_low}} – {{value_add_high}}</div>
      <div class="roi-sub">in home value, at an investment of {{cost_range_low}}–{{cost_range_high}}</div>
    </div>
    <div class="cta-bar">{{cta_text}}</div>
  </div>
  <div class="right">
    <div class="qr-section">
      {{qr_code_svg}}
      <div class="qr-label">Scan for your free estimate<br>or visit {{landing_page_url}}</div>
    </div>
    <div class="contractor">
      <div class="contractor-name">{{contractor_company_name}}</div>
      {{contractor_phone}}<br>
      {{contractor_email}}<br>
      {{contractor_return_address}}
    </div>
  </div>
</div>
<div class="disclaimers">
  {{ai_render_disclaimer}} {{roi_disclaimer}} {{google_attribution}}. To stop receiving mail from {{contractor_company_name}}, visit {{landing_page_url}} and click "Stop Mailings." Landing page slug: {{landing_page_slug}}
</div>
</body>
</html>`
}

export interface NicheTemplateCopy {
  accent_color: string
  headline: string
  subheadline: string
  body_copy: string
  cta_text: string
  stats_line: string
}

export const NICHE_TEMPLATE_COPY: Record<string, NicheTemplateCopy> = {
  landscaping: {
    accent_color: '#1a7f3c',
    headline: '{{owner_first_name}}, this could be your yard.',
    subheadline: 'A vision of what your home could look like.',
    body_copy:
      "We pulled up your property at {{property_street}} and used AI to visualize what a professional landscape transformation would look like. The \"after\" on the other side? That's your home. Scan the QR code to get a free, no-pressure estimate tailored to your property.",
    cta_text: 'SCAN QR FOR YOUR FREE ESTIMATE',
    stats_line: 'Projects like this recoup 450% of cost at resale.',
  },
  roofing: {
    accent_color: '#b91c1c',
    headline: '{{owner_first_name}}, your new roof could look like this.',
    subheadline: 'A preview of your home with a brand-new roof.',
    body_copy:
      "Based on satellite imagery of {{property_street}}, we generated what a professional roof replacement could look like on your home. A new roof recoups 65-80% of its cost at resale and can save you on insurance. Scan the QR to get a free inspection and quote.",
    cta_text: 'SCAN QR FOR A FREE ROOF INSPECTION',
    stats_line: 'New roofs recoup up to 80% at resale.',
  },
  solar: {
    accent_color: '#1e3a8a',
    headline: '{{owner_first_name}}, eliminate your electric bill.',
    subheadline: 'See what solar looks like on your roof.',
    body_copy:
      "Your home at {{property_street}} has a great roof for solar. We generated a visualization of what panels would look like — scan the QR for a free solar assessment including projected savings. 30% federal tax credit still available.",
    cta_text: 'SCAN QR FOR FREE SOLAR ASSESSMENT',
    stats_line: 'Solar eliminates your electric bill + adds home value.',
  },
  exterior_painting: {
    accent_color: '#475569',
    headline: '{{owner_first_name}}, imagine your home refreshed.',
    subheadline: 'A preview of your home with a fresh exterior.',
    body_copy:
      "We used AI to visualize what a modern color scheme would look like on your home at {{property_street}}. Exterior paint recoups 500%+ at resale — the highest ROI of any home improvement. Scan for a free color consultation and quote.",
    cta_text: 'SCAN QR FOR A FREE PAINT QUOTE',
    stats_line: 'Exterior paint recoups 550% at resale — highest ROI home improvement.',
  },
  fencing: {
    accent_color: '#78350f',
    headline: 'Your backyard, made private.',
    subheadline: 'A preview of your home with a new fence.',
    body_copy:
      "We visualized what a cedar privacy fence would look like around your backyard at {{property_street}}. A new fence adds $10K-$20K in home value and gives you a private outdoor space. Scan the QR for a free estimate.",
    cta_text: 'SCAN QR FOR A FREE FENCE ESTIMATE',
    stats_line: 'Privacy fences add $10K–$20K in home value.',
  },
  pool_installation: {
    accent_color: '#0369a1',
    headline: 'Your backyard oasis is closer than you think.',
    subheadline: 'See what a pool could look like on your property.',
    body_copy:
      "We looked at your backyard at {{property_street}} and visualized what an in-ground pool would look like. Pools add $40K-$80K in home value in this area. Scan the QR for a free pool design consultation.",
    cta_text: 'SCAN QR FOR A FREE POOL DESIGN',
    stats_line: 'Pools add $40K–$80K in home value in warm climates.',
  },
  driveway_paving: {
    accent_color: '#374151',
    headline: 'A driveway that makes your home stand out.',
    subheadline: 'See your home with a new paver driveway.',
    body_copy:
      "We visualized what interlocking pavers would look like on your driveway at {{property_street}}. A new paver driveway adds $15K-$30K in home value and lasts 30+ years. Scan the QR for a free estimate.",
    cta_text: 'SCAN QR FOR A FREE DRIVEWAY QUOTE',
    stats_line: 'Paver driveways add $15K–$30K in home value.',
  },
  pressure_washing: {
    accent_color: '#0284c7',
    headline: 'See the difference in one afternoon.',
    subheadline: 'A preview of your home cleaned up.',
    body_copy:
      "We visualized what a professional pressure wash would do for your home at {{property_street}} — driveway, walkways, siding. For $200–$800 you can add thousands in perceived value. Scan the QR to book a same-week appointment.",
    cta_text: 'SCAN QR TO BOOK YOUR WASH',
    stats_line: 'A $400 pressure wash adds $5K–$10K in perceived home value.',
  },
  hvac: {
    accent_color: '#0891b2',
    headline: 'Stop overpaying for cooling.',
    subheadline: 'A preview of your home with a new efficient HVAC system.',
    body_copy:
      "If your HVAC at {{property_street}} is 15+ years old, you're paying $1,200+/year more than you need to. A new high-efficiency system pays for itself in 6–8 years. Scan the QR for a free home energy audit.",
    cta_text: 'SCAN QR FOR A FREE ENERGY AUDIT',
    stats_line: 'New HVAC systems save $1,200+/year in energy costs.',
  },
}
