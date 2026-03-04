# PROJECT: BUN SQLITE MASTERY

## THE GOAL

Learn `bun:sqlite` and `Bun.env` from scratch — raw SQL only, no ORM.
By the end you'll know exactly what Drizzle is doing under the hood,
and upgrading your guestbook-api to persistent storage will be trivial.

---

## SETUP

```bash
mkdir bun-sqlite-mastery && cd bun-sqlite-mastery
bun init -y
touch .env
touch index.ts
```

Your `.env` file:

```env
PORT=3000
DB_PATH=./data/guestbook.db
```

No extra packages. `bun:sqlite` and `Bun.env` are both built into Bun.

---

## MILESTONE 1: ENV FIRST

**Goal:** Read configuration from environment variables before writing a single line of database code. Bad habits start early — fix it now.

### Requirements

- Read `PORT` and `DB_PATH` from `Bun.env`.
- Provide a sensible fallback for both if the variable is missing.
- Print the resolved values on startup so you can confirm it's working.

### Success Criteria

- ✅ Changing `.env` values changes the printed output without touching `index.ts`.
- ✅ Deleting `.env` doesn't crash the app — fallbacks kick in.
- ✅ No hardcoded port or path string anywhere in your code.

### What you'll learn

`Bun.env` is a plain object. `Bun.env.PORT` is always a `string | undefined`,
never a number. That's why you always do `Number(Bun.env.PORT) || 3000`.

---

## MILESTONE 2: OPEN THE DATABASE

**Goal:** Create a SQLite database file, define a schema, and confirm the table exists — no data yet.

### Requirements

- Import `Database` from `bun:sqlite`.
- Open (or create) the database at the path from your env.
- Create a `messages` table if it doesn't already exist:
  - `id` — INTEGER PRIMARY KEY AUTOINCREMENT
  - `name` — TEXT NOT NULL
  - `text` — TEXT NOT NULL
  - `created_at` — TEXT NOT NULL (store as ISO string)

### What "if not exists" means

`CREATE TABLE IF NOT EXISTS` means running your app twice won't crash on the second
run. You want this on every table creation — it's the SQLite equivalent of a safe migration.

### Success Criteria

- ✅ Running the app creates `guestbook.db` at your `DB_PATH`.
- ✅ Running it again doesn't throw an error.
- ✅ You can open the file with any SQLite viewer and see the `messages` table.

### Tip

```bash
# Inspect your db from the terminal
bunx --bun sqlite3 ./data/guestbook.db ".schema"
```

---

## MILESTONE 3: SEEDING

**Goal:** Populate the database with fake data so you have something to query.

### Requirements

- Write a `seed.ts` file (separate from `index.ts`).
- Insert 5 hardcoded messages into the `messages` table.
- Running `bun seed.ts` twice should NOT duplicate the data — guard against it.

### Two ways to guard against duplicate seeds

1. `DELETE FROM messages` before inserting (wipes and re-seeds).
2. Check `SELECT COUNT(*) FROM messages` — skip if rows already exist.

Pick one. Understand the tradeoff: option 1 is destructive but always clean, option 2 is safe but won't update changed seed data.

### Success Criteria

- ✅ After `bun seed.ts`, querying the database returns exactly 5 rows.
- ✅ Running `bun seed.ts` again doesn't create duplicates.
- ✅ Each row has a valid `created_at` value.

---

## MILESTONE 4: READ (SELECT)

**Goal:** Query the database and return all messages.

### Requirements

- Write a `getAllMessages()` function that returns all rows from `messages`.
- Write a `getMessageById(id: number)` function that returns one row, or `null` if not found.
- Use `.all()` for multiple rows, `.get()` for a single row.

### The prepare pattern

```typescript
// Prepare once, run many times — more efficient than running raw strings
const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
const row = stmt.get(id);
```

### Success Criteria

- ✅ `getAllMessages()` returns an array of all seeded rows.
- ✅ `getMessageById(1)` returns the first message.
- ✅ `getMessageById(9999)` returns `null`, not an error.
- ✅ TypeScript knows the shape of the returned row (define a `Message` type).

---

## MILESTONE 5: WRITE (INSERT)

**Goal:** Add new messages to the database.

### Requirements

- Write a `createMessage(name: string, text: string)` function.
- It should insert a new row and return the newly created message (including the auto-generated `id`).

### How to get the inserted row back

`db.run()` returns a result object with a `lastInsertRowid` property.
Use that to fetch and return the full row.

```typescript
const result = db.run('INSERT INTO messages (name, text, created_at) VALUES (?, ?, ?)', [...]);
const newMessage = getMessageById(Number(result.lastInsertRowid));
```

### Success Criteria

- ✅ Calling `createMessage('Tegar', 'hello from sqlite')` inserts a row.
- ✅ The function returns the full inserted object including `id` and `created_at`.
- ✅ The database file reflects the change persistently (restart the app, it's still there).

---

## MILESTONE 6: DELETE

**Goal:** Remove a message by ID.

### Requirements

- Write a `deleteMessage(id: number)` function.
- It should return `true` if a row was deleted, `false` if the ID didn't exist.

### How to detect "nothing was deleted"

`db.run()` returns `{ changes: number }` — the number of rows affected.
If `changes === 0`, the ID didn't exist.

### Success Criteria

- ✅ `deleteMessage(1)` removes the row and returns `true`.
- ✅ `deleteMessage(9999)` returns `false` without throwing.
- ✅ After deletion, `getAllMessages()` no longer includes the deleted row.

---

## MILESTONE 7: WIRE IT TO ELYSIA

**Goal:** Replace in-memory storage in a minimal Elysia app with your SQLite functions.

### Requirements

Build a small API (3 endpoints only) using the functions from milestones 4-6:

- `GET /messages` — calls `getAllMessages()`
- `POST /messages` — calls `createMessage()`, returns `201`
- `DELETE /messages/:id` — calls `deleteMessage()`, returns `204` or `404`

No file I/O. No `Bun.file`. No in-memory arrays. Just SQLite.

### Success Criteria

- ✅ Data persists across server restarts.
- ✅ `POST` then restart then `GET` still returns the posted message.
- ✅ `DELETE` on a non-existent ID returns `404`, not a crash.
- ✅ All config (port, db path) comes from `Bun.env`.

---

## MILESTONE 8: TRANSACTIONS (BONUS)

**Goal:** Understand why transactions exist and when you need them.

### The Problem

If you need to do two writes that must both succeed or both fail,
doing them separately means a crash between them leaves your database in a broken state.

### Requirements

- Write a `bulkInsert(messages: Array<{name: string, text: string}>)` function.
- Wrap all inserts in a single transaction.
- If any insert fails, roll back all of them.

```typescript
const bulkInsert = db.transaction((rows) => {
  for (const row of rows) {
    createMessage(row.name, row.text);
  }
});
```

### Success Criteria

- ✅ Inserting 3 messages in one call works.
- ✅ If one fails (e.g. null name violates NOT NULL), zero rows are inserted.
- ✅ You can explain why this matters for the guestbook-api in one sentence.

---

## AFTER THIS

Once you finish milestone 7, you're ready to:

1. **Add Drizzle to this project** — you'll immediately recognize what it's doing because you've written the raw SQL yourself.
2. **Upgrade guestbook-api** — swap the in-memory `messages` array for your SQLite functions. It's a 30-minute job at that point.

The order is: **this challenge → Drizzle on top of this → guestbook upgrade.**

---

## REFERENCE

```typescript
import { Database } from 'bun:sqlite';

const db = new Database('./data/guestbook.db');

// Create
db.run('CREATE TABLE IF NOT EXISTS ...');

// Insert
const result = db.run('INSERT INTO ... VALUES (?, ?)', [val1, val2]);
result.lastInsertRowid; // bigint — cast with Number()
result.changes;        // rows affected

// Query many
const rows = db.prepare('SELECT * FROM messages').all();

// Query one
const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);

// Transaction
const txn = db.transaction((data) => { /* multiple runs */ });
txn(data);
```

---

18 february - 3 march 2026 style.
good luck. you've got this.