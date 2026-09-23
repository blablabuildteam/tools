# BlaBlaBuild Tools

**Live:** https://tools.blablabuild.com

Interne workshop- en presentatietools.

## Tools

- **AI Use Case Matrix** (`/tools/ai-matrix`) — zelfde Upstash KV als blablabuild.com (`ai-matrix:{sessionId}`)
- **Process Workshop** (`/tools/workshop`) — gestructureerd bord + process-schets (`workshop:{sessionId}`)
  - Sophista: `/tools/workshop?s=sophista-dinsdag` — [`docs/sophista/`](docs/sophista/)
  - dioCON: `/tools/workshop?s=diocon-workshop` — [`docs/diocon/`](docs/diocon/)

## Setup

```bash
npx vercel env pull .env.local
npm install
npm run dev
```

## Deploy

Vercel project `blablabuild/tools`, domain `tools.blablabuild.com`, shared KV store `upstash-kv-almond-castle`.
