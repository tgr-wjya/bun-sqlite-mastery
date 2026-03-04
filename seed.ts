/**
 * Seeding the database
 *
 * @author Tegar Wijaya Kusuma
 * @date 5 March 2026
 */

import { Database } from "bun:sqlite";
import { SQL } from "bun";

const db = new Database(Bun.env.DB_PATH, { create: true });

const messages = [
	{ name: "Tegar Wijaya Kusuma", text: "made with ◉‿◉" },
	{ name: "Alice Wonderland", text: "Happy Wonderland, I guess" },
	{ name: "Claude", text: "Claude Code here." },
	{ name: "Jeremy", text: "Cricket!" },
	{ name: "Obamna", text: "Let me be clear!" },
];

await db.run(`INSERT INTO message ${SQL(messages)}`);
