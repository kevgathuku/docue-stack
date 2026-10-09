-- SQLite cannot ADD a NOT NULL column without a table rebuild; the app always
-- sets public_id, so UNIQUE plus this backfill is the enforcement.
UPDATE notes
SET public_id = 'note_' || substr(hex(randomblob(6)), 1, 12)
WHERE public_id IS NULL;
