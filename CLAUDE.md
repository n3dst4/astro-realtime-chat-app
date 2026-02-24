# Project Context

Astro + React + Cloudflare Workers app. Real-time dice roller using WebSockets and Durable Objects.

## Stack

- **Astro** (SSR via `@astrojs/cloudflare`)
- **React** for interactive UI islands
- **Cloudflare Durable Objects** for WebSocket rooms + SQLite via Drizzle ORM
- **Tailwind + DaisyUI v5**
- **`@dice-roller/rpg-dice-roller`** for formula parsing and rolling
- **Zod v4** (`zod/v4` import path)
- **pnpm**

## Key Files

| File | Purpose |
|---|---|
| `src/workers/DiceRollerRoom.ts` | Durable Object: WebSocket handling, rolling, DB writes |
| `src/workers/types.ts` | Shared types: message schemas, structured roll types |
| `src/db/roller-schema.ts` | Drizzle schema for the Messages table |
| `src/pages/roller/rooms/[roomName]/_components/DiceRoller.tsx` | Main chat/roll UI |
| `src/pages/roller/rooms/[roomName]/_components/DiceRollResult.tsx` | Renders a structured roll result |
| `src/durable-object-migrations/roller/` | SQL migrations + `migrations.js` index |
| `drizzle-roller.config.ts` | Drizzle config for the Durable Object SQLite DB |

## Useful Commands

```sh
pnpm run dev                  # local dev server
pnpm run deploy               # build + wrangler deploy
pnpm run db:generate:roller   # generate a new DO migration from schema changes
```

When you add a column to `src/db/roller-schema.ts`, always run `db:generate:roller` afterwards. The generator also auto-updates `migrations.js`.

---

## Dice Roll Data

### DB columns (`Messages` table)

| Column | Type | Notes |
|---|---|---|
| `formula` | `text` | The notation string, e.g. `"4d6dl1"` |
| `result` | `text` | Raw output string from `roll.output`, e.g. `"4d6dl1: [4, 1d, 5, 4] = 13"` |
| `rolls` | `text` | JSON — `roll.toJSON().rolls` (see below) |
| `total` | `int` | Numeric total from `roll.total` |
| `text` | `text` | Optional annotation / plain chat message |

### `rolls` JSON structure

Stored as `JSON.stringify(roll.toJSON().rolls)` — the structured output from the library. Typed as `StructuredRolls` in `src/workers/types.ts`.

The top-level array contains `RollEntry` items:

```
type RollEntry = RollResultsGroup | ResultGroupItem | string | number
```

- **`string`** — an operator: `"+"`, `"-"`, `"*"`, `"/"`
- **`number`** — a literal modifier, e.g. the `3` in `2d6+3`
- **`RollResultsGroup`** (`type: "roll-results"`) — a group of dice, e.g. all 3 dice from `3d6`
- **`ResultGroupItem`** (`type: "result-group"`) — produced by roll group notation `{...}`

#### `RollResultsGroup`

```ts
{
  type: "roll-results",
  rolls: RollResultItem[],
  value: number   // subtotal for this group
}
```

#### `RollResultItem` (a single die)

```ts
{
  type: "result",
  value: number,            // face value shown on the die
  initialValue: number,     // value before rerolls
  calculationValue: number, // what it contributes to the total
  modifierFlags: string,    // visual flags: "", "d", "!", "*", "**", "_", "__", "***"
  modifiers: string[],      // semantic names (see table below)
  useInTotal: boolean,      // false for dropped dice
}
```

#### `ResultGroupItem` (roll groups `{...}`)

```ts
{
  type: "result-group",
  isRollGroup: boolean,   // true on the outer { } wrapper, false on inner sub-expressions
  modifierFlags: string,  // "d" if this sub-expression was dropped
  modifiers: string[],    // ["drop"] if dropped
  useInTotal: boolean,    // false if this sub-expression was dropped
  calculationValue: number,
  value: number,          // subtotal for this sub-expression
  results: Array<RollResultsGroup | ResultGroupItem | string | number>
}
```

The outer `result-group` (`isRollGroup: true`) contains inner `result-group` children (`isRollGroup: false`), one per sub-expression. Drop/keep operates at the sub-expression level — `useInTotal: false` on the inner group means the whole sub-expression was dropped.

---

## `RollResultItem` modifier combinations

| `modifiers` | `modifierFlags` | `calculationValue` | Meaning |
|---|---|---|---|
| `[]` | `""` | face value | Normal die (sum roll) |
| `["drop"]` | `"d"` | face value | Dropped (excluded from total) |
| `["explode"]` | `"!"` | face value | Exploded |
| `["re-roll"]` | `"r"` | face value | Rerolled (shows final value) |
| `["critical-success"]` | `"**"` | face value | Crit (standalone, no pool) |
| `["critical-failure"]` | `"__"` | face value | Crit fail (standalone, no pool) |
| `["target-success"]` | `"*"` | `1` | Pool success |
| `["target-failure"]` | `"_"` | `-1` | Pool failure (explicit `f` modifier) |
| `["target-success", "critical-success"]` | `"***"` | `1` | Pool crit success |
| `["critical-failure"]` | `"__"` | `0` | Crit fail in pool (flagged, doesn't subtract) |

**Key distinction:**
- `target-failure` (explicit `f<=1`) → subtracts from count (`calculationValue: -1`)
- `critical-failure` in pool context (bare `cf`) → just flagged, `calculationValue: 0`

**Detecting a dice pool roll:** any `RollResultsGroup` containing at least one die with `"target-success"` or `"target-failure"` in its modifiers.

---

## Formula syntax notes (`@dice-roller/rpg-dice-roller`)

- `cs` / `cf` alone = crit on max / min die value (no comparison operator needed)
- `cs=6`, `cs>=5` etc. = explicit crit threshold (operator required when specifying a value)
- `cs6` is **invalid** — must be `cs=6`
- `f<=1` = explicit failure modifier (subtracts from pool total); distinct from `cf`
- Roll groups: `{3d8, 3d8}k1` — keep highest sub-expression; `{...}k2` keep top 2, etc.

---

## `DiceRollResult` component hierarchy

```
DiceRollResult
├── RollEntryNode          dispatches on entry type
│   ├── RollGroup          renders a roll-results group
│   │   └── DieChip        single die with visual treatment
│   ├── RollGroupContainer renders outer result-group (isRollGroup=true)
│   │   └── SubExpression  renders each inner sub-expression with subtotal
│   │       └── RollEntryNode (recursive)
│   ├── <span>             operator string (+, -, etc.)
│   └── <span>             literal number modifier
```

### `DieChip` visual priority

1. **Dropped** (`useInTotal: false`) — dim + strikethrough
2. **Pool crit** (`target-success + critical-success`) — bold green ring, `**` suffix
3. **Pool success** (`target-success`) — green ring/50%, `*` suffix
4. **Pool failure** (`target-failure`) — red ring/50%, `_` suffix
5. **Critical failure** (`critical-failure`) — red ring/50%, `__` suffix
6. **Standalone crit success** (`critical-success`, no pool) — green ring/50%
7. **Exploded** — amber ring/50%, `!` suffix
8. **Rerolled** — dim + strikethrough
9. **Pool miss** (pool context, no modifier, not crit-fail) — dim

Pool miss detection excludes `critical-failure` dice so they show red rather than being dimmed.