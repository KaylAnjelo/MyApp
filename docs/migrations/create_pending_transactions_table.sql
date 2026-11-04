-- Create pending_transactions table for storing QR codes and short codes
CREATE TABLE IF NOT EXISTS public.pending_transactions (
  id SERIAL NOT NULL,
  short_code CHARACTER VARYING(20) NOT NULL,
  reference_number CHARACTER VARYING(100) NOT NULL,
  transaction_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT pending_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT pending_transactions_short_code_key UNIQUE (short_code),
  CONSTRAINT pending_transactions_reference_number_key UNIQUE (reference_number)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_transactions_short_code ON public.pending_transactions USING btree (short_code);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_expires_at ON public.pending_transactions USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_used ON public.pending_transactions USING btree (used);

-- Optionally, create a view to see only active pending transactions
CREATE OR REPLACE VIEW active_pending_transactions AS
SELECT * FROM public.pending_transactions
WHERE used = FALSE AND expires_at > NOW();

-- Optional: Create a function to clean up expired codes periodically
CREATE OR REPLACE FUNCTION cleanup_expired_pending_transactions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.pending_transactions
  WHERE expires_at < NOW() AND used = FALSE;
END;
$$ LANGUAGE plpgsql;
