# BlaBlaBuild Tools — tools.blablabuild.com

Interne workshop- en presentatietools.

**Live nu:** https://tools-lake-three.vercel.app  
(Custom domain `tools.blablabuild.com` volgt zodra DNS in Hostinger staat.)

## Tools

- **AI Use Case Matrix** (`/tools/ai-matrix`) — zelfde Upstash KV als blablabuild.com (`ai-matrix:{sessionId}`)
- **Process Workshop** (`/tools/workshop`) — gestructureerd bord + tldraw-schets (`workshop:{sessionId}`)

## Setup

```bash
npx vercel env pull .env.local
npm install
npm run dev
```

## Deploy / domain

Project: Vercel `blablabuild/tools`  
KV: gedeelde store `upstash-kv-almond-castle` (zelfde als marketing site)

Voor `tools.blablabuild.com` in Hostinger DNS:

1. CNAME `tools` → `cname.vercel-dns.com`
2. In Vercel: Project tools → Domains → add `tools.blablabuild.com`
3. Daarna redirect in blablabuild `next.config.js` updaten naar `https://tools.blablabuild.com/...`
