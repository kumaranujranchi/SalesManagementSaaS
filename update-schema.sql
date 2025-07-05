-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS joining_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS monthly_target DOUBLE PRECISION;

-- Create targets table
CREATE TABLE IF NOT EXISTS targets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  target_value DOUBLE PRECISION NOT NULL,
  achieved DOUBLE PRECISION DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index to prevent duplicate target entries
CREATE UNIQUE INDEX IF NOT EXISTS targets_user_year_month_idx ON targets (user_id, year, month);