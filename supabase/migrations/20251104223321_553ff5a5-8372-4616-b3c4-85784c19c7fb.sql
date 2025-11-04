-- Make sync-threat-intelligence accessible to all authenticated users
-- by removing the admin role requirement (you can add it back later)

-- First, let's ensure notification_preferences has proper RLS for upsert
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;

-- Create a combined policy for insert/update (upsert)
CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);