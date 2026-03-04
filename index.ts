/**
 * Index.ts for learning Bun:SQLite!
 *
 * @author Tegar Wijaya Kusuma
 * @date 4 - 5 March 2026
 * @note this should be easy, let's see.
 */

/**
 * IMPORT
 */
import { Database } from "bun:sqlite";

/**
 * Const definition goes here
 */
const PORT = Number(Bun.env.PORT) || 3000;
const db = new Database(Bun.env.DB_PATH, { create: true });
