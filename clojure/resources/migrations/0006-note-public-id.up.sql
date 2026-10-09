ALTER TABLE notes ADD COLUMN public_id TEXT;
CREATE UNIQUE INDEX notes_public_id_unique ON notes(public_id);
