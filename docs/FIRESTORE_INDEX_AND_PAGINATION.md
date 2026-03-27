# Firestore Index and Pagination Standards

## 1) Leaderboard Query Rule

- Use **single `orderBy`** in Firestore leaderboard queries to avoid composite-index coupling in production.
- Apply tie-break on the server after fetch.

Example standard:

- Query: `orderBy("score", "desc").limit(N)`
- Tie-break: `evaluatedAt asc` in application code

## 2) List Endpoint Contract

All list-style API routes must enforce:

- Required `limit` query param
- Optional `cursor` query param
- Response shape:
  - `items` (or `runs` / `leaderboard`)
  - `nextCursor` (`string | number | null`)

## 3) Applied Endpoints

- `GET /api/matching/history?limit=...&cursor=...`
- `GET /api/roadmap/history?limit=...&cursor=...`
- `GET /api/ai-score/leaderboard?limit=...&cursor=...`

## 4) Cursor Semantics

- Matching / roadmap cursor: last `createdAt` value.
- AI score leaderboard cursor: numeric offset cursor.

## 5) Operational Notes

- If sorting logic changes, update this document and corresponding API tests together.
- Keep `limit` bounded server-side to protect Firestore reads.
