-- Enable realtime for threats table
ALTER TABLE public.threats REPLICA IDENTITY FULL;

-- Add RLS policy to allow users to insert their own notifications
CREATE POLICY "Users can create their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create notification_preferences table for alert criteria
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_on_critical BOOLEAN DEFAULT true,
  alert_on_high BOOLEAN DEFAULT true,
  alert_on_medium BOOLEAN DEFAULT false,
  alert_on_low BOOLEAN DEFAULT false,
  alert_countries TEXT[] DEFAULT NULL,
  alert_threat_types TEXT[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_threats_updated_at();