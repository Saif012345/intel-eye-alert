
-- Cases table for incident/case management
CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  severity text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  threat_id uuid REFERENCES public.threats(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Case notes for analyst collaboration
CREATE TABLE public.case_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Shared annotations on threats
CREATE TABLE public.case_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  threat_id uuid REFERENCES public.threats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  annotation text NOT NULL,
  tag text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_annotations ENABLE ROW LEVEL SECURITY;

-- Cases: all authenticated users can view and create; only creator/assignee can update
CREATE POLICY "Authenticated users can view all cases"
  ON public.cases FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create cases"
  ON public.cases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator or assignee can update cases"
  ON public.cases FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Creator can delete cases"
  ON public.cases FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Case notes: all authenticated can view; only author can modify
CREATE POLICY "Authenticated users can view all case notes"
  ON public.case_notes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create notes"
  ON public.case_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can update their notes"
  ON public.case_notes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authors can delete their notes"
  ON public.case_notes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Annotations: all authenticated can view; only author can modify
CREATE POLICY "Authenticated users can view annotations"
  ON public.case_annotations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create annotations"
  ON public.case_annotations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can delete annotations"
  ON public.case_annotations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_annotations;
