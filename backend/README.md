# Multiplayer Tic-Tac-Toe — Nakama Backend

Server-authoritative multiplayer Tic-Tac-Toe built on [Nakama](https://heroiclabs.com/nakama/) with TypeScript. Includes matchmaking, leaderboards, timed game mode, match history, and a pluggable adapter layer for third-party integrations.

---

## Table of contents

1. [Architecture](#architecture)
2. [Project structure](#project-structure)
3. [Setup and installation](#setup-and-installation)
4. [Configuration](#configuration)
5. [Running locally](#running-locally)
6. [Deployment](#deployment)
7. [API reference](#api-reference)
8. [Testing multiplayer](#testing-multiplayer)
9. [Extending the backend](#extending-the-backend)

---

## Architecture

```
Client (WebSocket)
      │
      ▼
Nakama server  (heroiclabs/nakama:3.22.0)
  ├── TypeScript runtime  (/backend/build)
  │     ├── MatchHandler       — 7 authoritative match lifecycle hooks
  │     ├── GameSession        — pure game logic, no Nakama dependency
  │     ├── Board              — immutable board, win detection
  │     ├── TurnTimer          — deadline enforcement (NoOp in classic mode)
  │     ├── Broadcaster        — typed wrapper over MatchDispatcher
  │     ├── MatchmakerService  — pairs players, creates matches
  │     ├── LeaderboardService — win tracking + RPC endpoints
  │     └── Adapters           — pluggable storage + analytics
  └── PostgreSQL  (all persistence)
```

**Server-authoritative** means every move is sent to the server, validated, and the new state broadcast back. Clients never mutate state locally — they only render what the server sends.

### Design decisions

| Decision | Rationale |
|---|---|
| OOP + static match hooks | Nakama expects plain functions; factory pattern closes over deps cleanly |
| `GameSession.fromSnapshot()` | Nakama serialises state between ticks; rehydration is explicit and type-safe |
| `NoOpTurnTimer` subclass | Classic mode has zero timer branches in the hot match loop |
| Adapter interfaces | Swap storage/analytics backends without touching game logic |
| `buildConfig()` from env | Every value tunable at deploy time without a rebuild |
| `noUnusedLocals: true` | Enforced at compile time; unused params prefixed `_` by convention |

---

## Project structure

```
nakama-tictactoe/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts                          ← composition root
│       ├── types/index.ts                   ← all shared types + enums
│       ├── constants/index.ts               ← zero magic strings/numbers
│       ├── config/index.ts                  ← typed config + env overrides
│       ├── core/
│       │   ├── Board.ts                     ← pure game logic
│       │   ├── GameSession.ts               ← match state owner
│       │   └── TurnTimer.ts                 ← deadline logic
│       ├── match/
│       │   ├── Broadcaster.ts               ← typed MatchDispatcher wrapper
│       │   ├── MatchHandler.ts              ← all 7 Nakama hooks
│       │   └── MatchHandlerFactory.ts       ← dependency injection
│       ├── matchmaker/
│       │   └── MatchmakerService.ts
│       ├── leaderboard/
│       │   └── LeaderboardService.ts
│       └── adapters/
│           ├── storage/NakamaStorageAdapter.ts
│           └── analytics/NoOpAnalyticsAdapter.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Setup and installation

### Prerequisites

- Node.js 18+
- Docker + Docker Compose v2

### Install and build

```bash
git clone <your-repo-url>
cd nakama-tictactoe

# Install TypeScript dependencies
cd backend
npm install

# Build (outputs to backend/build/)
npm run build

cd ..
```

> **One-time tsconfig fix** — Nakama's runtime requires `target: es5`. TypeScript 5.4+ flags this as deprecated. Add `"ignoreDeprecations": "6.0"` to `tsconfig.json` compilerOptions to silence it.

---

## Configuration

Copy `.env.example` to `.env` and edit before running:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | `localdev` | PostgreSQL password |
| `SERVER_KEY` | `defaultkey` | Nakama socket server key |
| `LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARN` / `ERROR` |
| `TURN_TIMEOUT_SEC` | `30` | Seconds per turn in timed mode |
| `DEFAULT_MODE` | `classic` | `classic` or `timed` |
| `LEADERBOARD_TOP_N` | `10` | Number of entries returned by leaderboard RPC |
| `TIMED_MODE_ENABLED` | `true` | Feature flag for timed mode |
| `LEADERBOARD_ENABLED` | `true` | Feature flag for leaderboard + RPCs |
| `MATCH_HISTORY_ENABLED` | `true` | Feature flag for writing match results to storage |
| `ANALYTICS_ENABLED` | `false` | Feature flag for analytics adapter |

All variables under "Runtime feature flags" are forwarded into the TypeScript runtime via `ctx.env`.

---

## Running locally

```bash
# Start Postgres + Nakama (builds runtime from backend/build/)
docker compose up

# Or rebuild and restart in one step
cd backend && npm run build && cd .. && docker compose up --force-recreate nakama
```

| Endpoint | URL |
|---|---|
| HTTP API | `http://localhost:7349` |
| gRPC API | `localhost:7350` |
| Developer console | `http://localhost:7351` |

Default console login: **admin / password**

The developer console lets you inspect live matches, storage records, leaderboard entries, and send RPC calls directly.

---

## Deployment

### DigitalOcean Droplet (recommended — cheapest path)

1. **Create a Droplet** — Ubuntu 22.04, $6/mo Basic (1 vCPU, 1GB RAM) is sufficient for the assignment.

2. **Install Docker on the Droplet:**

```bash
ssh root@<your-droplet-ip>

apt update && apt install -y docker.io docker-compose-plugin
systemctl enable docker && systemctl start docker
```

3. **Open firewall ports** in the DigitalOcean control panel:
   - `7349` (HTTP API)
   - `7350` (gRPC)
   - `7351` (console — restrict to your IP in production)

4. **Upload the project:**

```bash
# From your local machine
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  . root@<your-droplet-ip>:/opt/tictactoe/
```

5. **Set production env and start:**

```bash
ssh root@<your-droplet-ip>
cd /opt/tictactoe

cp .env.example .env
# Edit .env — set strong POSTGRES_PASSWORD and SERVER_KEY

docker compose up -d
```

6. **Verify:**

```bash
curl http://<your-droplet-ip>:7349/healthcheck
# Expected: {"status": "ok"}
```

Your Nakama endpoint: `http://<your-droplet-ip>:7350`

### Other cloud providers

The `docker-compose.yml` works on any Ubuntu/Debian host with Docker. For AWS:
- EC2 t3.micro (free tier) + Security Group opening ports 7349/7350/7351
- Or ECS with Fargate (replace compose with a task definition)

---

## API reference

### WebSocket connection

```typescript
import { Client } from "@heroiclabs/nakama-js";

const client = new Client("defaultkey", "localhost", "7350");
const session = await client.authenticateDevice(uniqueDeviceId);
const socket  = client.createSocket();
await socket.connect(session);
```

### Matchmaking

```typescript
// Join the matchmaker queue
await socket.addMatchmaker("*", 2, 2, { mode: "classic" }); // or "timed"

// Nakama fires this when a pair is found
socket.onmatchmakermatched = async (matched) => {
  const match = await socket.joinMatch(matched.token);
  console.log("Match joined:", match.match_id);
};
```

### Sending a move

```typescript
// OpCode 2 = MakeMove
await socket.sendMatchState(matchId, 2, JSON.stringify({ position: 4 }));
//                                                        ^^ 0–8 (center)
```

### Receiving messages

| OpCode | Type | Payload |
|---|---|---|
| `1` | `game_start` | `{ board, marks, turn, mode, turnDeadline }` |
| `3` | `board_update` | `{ board, turn, turnDeadline }` |
| `5` | `game_over` | `{ board, winner, reason }` |
| `9` | `error` | `{ message }` |

```typescript
socket.onmatchdata = (data) => {
  const msg = JSON.parse(new TextDecoder().decode(data.data));

  switch (data.op_code) {
    case 1: handleGameStart(msg);  break;
    case 3: handleBoardUpdate(msg); break;
    case 5: handleGameOver(msg);   break;
    case 9: handleError(msg);      break;
  }
};
```

### Game over reasons

| Reason | Description |
|---|---|
| `win` | A player completed a line |
| `draw` | Board full, no winner |
| `timeout` | Active player exceeded their turn timer |
| `opponent_left` | Opponent disconnected mid-game |

### RPC endpoints

```typescript
// Top-N leaderboard
const result = await client.rpcGet(session, "get_leaderboard", "");
// Returns: [{ userId, username, wins, rank }]

// Calling player's own stats
const stats = await client.rpcGet(session, "get_my_stats", "");
// Returns: { wins, rank }
```

---

## Testing multiplayer

### Option 1 — Nakama developer console

1. Open `http://localhost:7351`
2. Go to **Runtime** → **RPC** and call `get_leaderboard`
3. Go to **Matches** to inspect live match state

### Option 2 — Two browser tabs

Open the Nakama JS SDK playground or a minimal HTML page in two separate browser tabs and authenticate with two different device IDs:

```javascript
// Tab 1
const session1 = await client.authenticateDevice("device-001");
await socket1.addMatchmaker("*", 2, 2, {});

// Tab 2 (separate tab or incognito)
const session2 = await client.authenticateDevice("device-002");
await socket2.addMatchmaker("*", 2, 2, {});
// Matchmaker pairs them automatically
```

### Option 3 — curl RPC

```bash
# Get a session token first (device auth)
curl -X POST http://localhost:7349/v2/account/authenticate/device \
  -H "Authorization: Basic $(echo -n 'defaultkey:' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"id": "test-device-001", "create": true}' \
  | jq .token

# Call leaderboard RPC
curl http://localhost:7349/v2/rpc/get_leaderboard \
  -H "Authorization: Bearer <token>"
```

---

## Extending the backend

### Add a real analytics adapter

1. Create `backend/src/adapters/analytics/SegmentAnalyticsAdapter.ts`:

```typescript
import { IAnalyticsAdapter, GameMode, GameOverReason } from "../../types";

export class SegmentAnalyticsAdapter implements IAnalyticsAdapter {
  constructor(private readonly writeKey: string) {}

  trackMatchEnd(matchId: string, winnerId: string | null, reason: GameOverReason, mode: GameMode): void {
    // POST to https://api.segment.io/v1/track
  }
}
```

2. In `main.ts`, swap one line:

```typescript
// Before:
const analytics = new NoOpAnalyticsAdapter();

// After:
const analytics = new SegmentAnalyticsAdapter(ctx.env["SEGMENT_WRITE_KEY"] ?? "");
```

3. Set `ANALYTICS_ENABLED=true` in `.env`. Done — no other file changes needed.

### Add a custom storage adapter

Same pattern — implement `IStorageAdapter` and swap it in `main.ts`.

### Add new RPCs

Register them in `main.ts`:

```typescript
initializer.registerRpc("my_new_rpc", myService.myMethod);
```

### Tune game rules

All tunable values are in `.env` and resolve through `buildConfig()` — no code changes needed for timeout, leaderboard size, or feature flags.
