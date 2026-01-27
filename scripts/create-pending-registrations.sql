-- Create pending_registrations table
CREATE TABLE IF NOT EXISTS pending_registrations (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone_number VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  nationality VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  occupation VARCHAR(100),
  employer VARCHAR(200),
  annual_income VARCHAR(50),
  profile_photo TEXT,
  email_otp VARCHAR(10) NOT NULL,
  otp_expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON pending_registrations(email);
