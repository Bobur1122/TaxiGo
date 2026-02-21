-- Create RPC function to add driver earnings to wallet
CREATE OR REPLACE FUNCTION add_driver_earnings(
  driver_id UUID,
  amount INTEGER,
  ride_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update driver profile wallet balance
  UPDATE driver_profiles 
  SET wallet_balance = wallet_balance + amount,
      total_earnings = total_earnings + amount,
      updated_at = NOW()
  WHERE id = driver_id;

  -- Create earnings transaction record for audit trail
  INSERT INTO public.transactions (driver_id, type, amount, ride_id, description, created_at)
  VALUES (driver_id, 'earnings', amount, ride_id, 'Earnings from completed ride', NOW())
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_driver_earnings(UUID, INTEGER, UUID) TO authenticated;
