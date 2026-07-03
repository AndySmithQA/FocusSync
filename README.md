# FocusSync

Shared focus timer for remote teams. A host creates a room with a 6-character code, teammates join with a display name, and everyone sees the same 25-minute focus / 5-minute break timer synced over WebSocket.

## Prerequisites

- Node.js 20+

## Setup

```bash
npm install
npm run dev
```

This starts:

- **Client** at http://localhost:5173 (Vite + React)
- **Server** at http://localhost:3001 (Express + WebSocket)

The Vite dev server proxies `/ws` and `/health` to the backend.

## Architecture

The **server owns the canonical timer**. Each room stores `phase`, `status`, and `endsAt` (server timestamp). Clients render `remaining = endsAt - now` locally for smooth display and resync on every `room_state` or `timer_tick` message.

When a focus block ends, the server auto-advances to break and broadcasts updated state. If the host disconnects, the timer keeps running for up to 10 minutes; host controls are disabled until the host reconnects. After 10 minutes without the host, the room expires.

## WebSocket messages

All messages are JSON discriminated unions with a `type` field (see `shared/types.ts`).

### Client → Server

| Type | Fields | Description |
|------|--------|-------------|
| `join_room` | `intent`, `name`, `code?`, `participantId?` | Create or join a room; `participantId` enables reconnect |
| `host_control` | `action: start \| pause \| skip` | Host-only timer controls |

### Server → Client

| Type | Fields | Description |
|------|--------|-------------|
| `room_state` | `room` | Full room snapshot (participants, phase, timer) |
| `timer_tick` | `serverTime`, `phase`, `status`, `endsAt` | Lightweight sync while timer is running |
| `error` | `code`, `message` | Validation or permission errors |

## Known limitations (v1)

- No authentication or accounts
- No database — rooms are in-memory only
- Single server process (no horizontal scaling)
- Fixed 25/5 minute Pomodoro durations
- Display names are not verified

## Manual test steps

Use two browser windows (or one normal + one incognito) to simulate host and teammate.

- [ ] **Create room** — Enter a name, click "Create room". A 6-character code appears with a Copy button.
- [ ] **Copy room code** — Click Copy; paste into the join form in the second window. Code should match.
- [ ] **Join room** — Second window joins with the code and a display name. Both windows show both participants.
- [ ] **Start timer** — Host clicks Start. Both countdowns show the same time within ~1 second.
- [ ] **Pause timer** — Host clicks Pause. Both timers freeze at the same value.
- [ ] **Skip phase** — Host clicks Skip. Both clients switch phase (focus ↔ break) together.
- [ ] **Session summary** — After a focus block ends (use Skip from focus while running, or wait 25 minutes), both clients show the "Focus block complete" summary modal.
- [ ] **Refresh tab** — Refresh either window. It should rejoin automatically with the same name and show the correct remaining time.
- [ ] **Host disconnect** — Host closes their tab. Teammate sees "Host disconnected. Room expires in …" banner; timer still advances.
- [ ] **Host reconnect** — Host reopens the app within 10 minutes (same browser session). Host controls work again.
- [ ] **Room expiry** — With host still gone, wait 10+ minutes (or temporarily lower `HOST_GRACE_MS` in `shared/types.ts` for testing). Room expires; clients return to landing with an error message.

## Project structure

```
client/     Vite + React + TypeScript UI
server/     Express + ws timer authority
shared/     Shared TypeScript types and constants
```
