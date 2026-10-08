DO $$
BEGIN
  UPDATE notes
  SET public_id = 'note_' || substr(md5(random()::text), 1, 12)
  WHERE public_id IS NULL;
  ALTER TABLE notes ALTER COLUMN public_id SET NOT NULL;
END $$;
