-- Add booking fields to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS booking_done TEXT DEFAULT 'No';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS booking_data TEXT;