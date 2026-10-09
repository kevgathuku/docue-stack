-- The backfill is data, not schema: nothing to undo. Valid no-op keeps Migratus happy.
UPDATE notes SET public_id = public_id;
