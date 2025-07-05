-- Add DC, PLC, and Plot No fields to sales table
DO $$
BEGIN
    -- Add development_charges column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'development_charges'
    ) THEN
        ALTER TABLE sales ADD COLUMN development_charges NUMERIC DEFAULT 0;
    END IF;

    -- Add preferred_location_charge column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'preferred_location_charge'
    ) THEN
        ALTER TABLE sales ADD COLUMN preferred_location_charge NUMERIC DEFAULT 0;
    END IF;

    -- Add plot_no column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'plot_no'
    ) THEN
        ALTER TABLE sales ADD COLUMN plot_no TEXT;
    END IF;
END $$;