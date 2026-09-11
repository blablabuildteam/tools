# BlaBlaBuild Tools — tools.blablabuild.com

Interne workshop- en presentatietools.

## Tools

- **AI Use Case Matrix** (`/tools/ai-matrix`) — zelfde Vercel KV keys als blablabuild.com (`ai-matrix:{sessionId}`)
- **Process Workshop** (`/tools/workshop`) — gestructureerd bord + tldraw-schets (`workshop:{sessionId}`)

## Setup

```bash
cp .env.example .env.local
# Vul KV_REST_API_URL + KV_REST_API_TOKEN in (zelfde als blablabuild)
npm install
npm run dev
```

## Deploy

Koppel dit project aan `tools.blablabuild.com` op Vercel en hergebruik dezelfde KV/Upstash integration als de marketing site.

Daarna op blablabuild.com een redirect zetten van `/tools/ai-matrix` → `https://tools.blablabuild.com/tools/ai-matrix`.
