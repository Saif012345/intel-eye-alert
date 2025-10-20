-- Create threats table
CREATE TABLE public.threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  indicator TEXT,
  country TEXT,
  ai_summary TEXT,
  risk_insight TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.threats ENABLE ROW LEVEL SECURITY;

-- Public read access for threat data
CREATE POLICY "Threats are viewable by everyone" 
ON public.threats 
FOR SELECT 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_threats_severity ON public.threats(severity);
CREATE INDEX idx_threats_type ON public.threats(threat_type);
CREATE INDEX idx_threats_created_at ON public.threats(created_at DESC);
CREATE INDEX idx_threats_indicator ON public.threats(indicator);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_threats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_threats_timestamp
BEFORE UPDATE ON public.threats
FOR EACH ROW
EXECUTE FUNCTION public.update_threats_updated_at();