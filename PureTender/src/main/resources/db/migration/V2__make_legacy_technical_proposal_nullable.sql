DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'bids'
          AND column_name = 'technical_proposal'
    ) THEN
        ALTER TABLE bids ALTER COLUMN technical_proposal DROP NOT NULL;
    END IF;
END;
$$;
