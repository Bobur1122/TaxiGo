-- Fix RLS to allow drivers to accept pending rides
-- The issue is that rides_update_driver requires driver_id = auth.uid()
-- But when accepting, driver_id is NULL, so the policy blocks it

-- We need a policy that allows drivers to update pending rides (accept them)
-- And set driver_id and status simultaneously

DROP POLICY IF EXISTS "rides_update_driver" ON public.rides;

-- New policy: Driver can accept pending rides (update driver_id and status)
CREATE POLICY "rides_accept_pending" ON public.rides
  FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (auth.uid() = driver_id AND status IN ('pending', 'accepted'));

-- Also allow driver to update their own accepted/active rides
CREATE POLICY "rides_update_own_active" ON public.rides
  FOR UPDATE
  USING (auth.uid() = driver_id AND status IN ('accepted', 'arriving', 'in_progress'))
  WITH CHECK (auth.uid() = driver_id);
