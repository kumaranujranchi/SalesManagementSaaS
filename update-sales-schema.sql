-- Add new columns to sales table if they don't exist
DO $$
BEGIN
    -- Add customer_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE sales ADD COLUMN customer_name TEXT;
    END IF;

    -- Add customer_mobile column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'customer_mobile'
    ) THEN
        ALTER TABLE sales ADD COLUMN customer_mobile TEXT;
    END IF;

    -- Add base_sale_price column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'base_sale_price'
    ) THEN
        ALTER TABLE sales ADD COLUMN base_sale_price NUMERIC;
    END IF;

    -- Add final_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'final_amount'
    ) THEN
        ALTER TABLE sales ADD COLUMN final_amount NUMERIC DEFAULT 0;
    END IF;

    -- Add amount_paid column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'amount_paid'
    ) THEN
        ALTER TABLE sales ADD COLUMN amount_paid NUMERIC DEFAULT 0;
    END IF;

    -- Add payment_percentage column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'payment_percentage'
    ) THEN
        ALTER TABLE sales ADD COLUMN payment_percentage NUMERIC DEFAULT 0;
    END IF;

    -- Create payments table if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payments'
    ) THEN
        CREATE TABLE payments (
            id SERIAL PRIMARY KEY,
            sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
            payment_date DATE NOT NULL,
            amount NUMERIC NOT NULL,
            payment_mode TEXT NOT NULL,
            payment_type TEXT NOT NULL,
            remarks TEXT,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

END $$;