-- Migration: Add fields to main_menu table
-- Adds path, icon, order, isActive columns to main_menu


-- Add 'icon' column if not exists
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name='main_menu' AND column_name='icon'
	) THEN
		ALTER TABLE main_menu ADD COLUMN icon VARCHAR(255);
	END IF;
END$$;

-- Add 'order' column if not exists
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name='main_menu' AND column_name='order'
	) THEN
		ALTER TABLE main_menu ADD COLUMN "order" INTEGER;
	END IF;
END$$;

-- Add 'isActive' column if not exists
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name='main_menu' AND column_name='isActive'
	) THEN
		ALTER TABLE main_menu ADD COLUMN "isActive" BOOLEAN DEFAULT TRUE;
	END IF;
END$$;


-- Add 'isHeaderMenu' column if not exists
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name='main_menu' AND column_name='isHeaderMenu'
	) THEN
		ALTER TABLE main_menu ADD COLUMN "isHeaderMenu" BOOLEAN DEFAULT FALSE;
	END IF;
END$$;