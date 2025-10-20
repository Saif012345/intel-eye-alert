-- Fix function search path security issue
DROP FUNCTION IF EXISTS public.update_threats_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_threats_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_threats_timestamp
BEFORE UPDATE ON public.threats
FOR EACH ROW
EXECUTE FUNCTION public.update_threats_updated_at();