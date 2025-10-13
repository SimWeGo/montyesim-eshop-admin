DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_bundle_tag'
    ) THEN
        ALTER TABLE bundle_tag
        ADD CONSTRAINT unique_bundle_tag UNIQUE (bundle_id, tag_id);
    END IF;
END $$;


-- NOTE : without this constraint the assign bundle to group will not work