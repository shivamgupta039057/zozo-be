-- Migration: Add media_type and media_url to WhatsappMessage table if not exist
DO $$
BEGIN
    -- Add media_type column if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='whatsapp_messages' AND column_name='media_type'
    ) THEN
        ALTER TABLE whatsapp_messages ADD COLUMN media_type VARCHAR(255);
    END IF;

    -- Add media_url column if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='whatsapp_messages' AND column_name='media_url'
    ) THEN
        ALTER TABLE whatsapp_messages ADD COLUMN media_url VARCHAR(255);
    END IF;
END $$;
