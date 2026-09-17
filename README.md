# Shelfmark — AI Product Card Generator

Enter a product name and category, click **Generate details**, and it writes a
market-ready title, description, and search tags using Groq's LLM API — then renders
them as a styled product card with an auto-generated cover in place of a photo.

**Repo:** https://github.com/DeYSayaN98/ai-product-card-generator

## Folder structure

```
ai-product-card-generator/
├── client/ # React app (Vite)
│ └── src/
│ ├── App.jsx # Form, live card preview, loading skeleton, copy button
│ ├── App.css # Theme, layout, animations, responsive breakpoints
│ └── main.jsx
├── server/ # Express API
│ └── index.js # /api/generate — calls Groq, returns structured JSON
└── README.md
```


## Tech stack

- **Frontend:** React 19 + Vite, Space Grotesk + Inter (Google Fonts)
- **Backend:** Node.js + Express
- **AI:** Groq API (`groq-sdk`), JSON mode for structured output
- **State:** local component state (`useState`) — no external state library needed

## Setup

### 1. Get a free Groq API key
Sign up at [console.groq.com](https://console.groq.com) → API Keys → create a new key.

### 2. Backend

```bash
cd server
npm install
copy .env.example .env      # Windows — use `cp` instead on macOS/Linux
# edit .env: paste your GROQ_API_KEY
npm start
```
Server runs on `http://localhost:5001`.

`.env` variables:
| Variable | Required | Default | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | From console.groq.com |
| `GROQ_MODEL` | No | `openai/gpt-oss-120b` | Any current Groq production model, e.g. `openai/gpt-oss-20b` for faster/cheaper |
| `PORT` | No | `5001` | Backend port |

### 3. Frontend

In a new terminal:
```bash
cd client
npm install
npm run dev
```
Open the printed local URL (usually `http://localhost:5173`). Vite proxies `/api/*`
calls to the backend automatically in dev mode.

For a production build:
```bash
npm run build
```
If you deploy the frontend and backend on different domains, set `VITE_API_BASE_URL`
in `client/.env` to your backend's URL (see `client/.env.example`).

## UI

- Boutique-catalog theme: warm paper background, forest green + coral accents,
  Space Grotesk headline paired with Inter body text
- Two-pane layout — form on the left, live card preview on the right (stacks on mobile)
- Since no image is generated, each card gets a deterministic gradient cover with a
  monogram letter (derived from the product name) instead of a blank or broken-looking
  photo slot
- Skeleton-loading card with a shimmer effect while the AI writes the listing, plus a
  bouncing-dot indicator inside the button itself
- Copy button on the finished card — copies title, description, and tags as plain text
- Fully responsive down to small phones; respects `prefers-reduced-motion` and has
  visible keyboard focus states

## How AI was used in this project

- A Groq-hosted model (`openai/gpt-oss-120b` by default, configurable via `GROQ_MODEL`)
  is called server-side in `server/index.js` using **JSON mode**, with a short system
  prompt requiring exactly three fields back: `title`, `description`, and `tags`.
- `reasoning_effort: "low"` and a generous `max_tokens` (1024) are set because GPT-OSS
  is a reasoning model — without headroom it can spend its whole token budget
  "thinking" before writing the JSON and return an incomplete response.
- The response is validated server-side (checked for required fields, lengths capped)
  before being sent to the frontend, so a malformed AI response surfaces as a clear
  error instead of breaking the UI.
- Claude (Anthropic) was used as a coding assistant to scaffold this project — the
  React UI, Express API, prompt design, and this README were generated with its help.

## API

`POST /api/generate`
```json
{ "productName": "Ceramic pour-over coffee dripper", "category": "Home & Kitchen" }
```
Response:
```json
{
  "title": "Artisan Ceramic Pour-Over Dripper",
  "description": "…",
  "tags": ["coffee", "pour-over", "ceramic", "kitchen"],
  "productName": "Ceramic pour-over coffee dripper",
  "category": "Home & Kitchen"
}
```

## Notes / limitations

- No database — this is stateless; each generation is a fresh request.
- No real image generation — the card uses a generated gradient + monogram cover in
  place of an actual product photo.