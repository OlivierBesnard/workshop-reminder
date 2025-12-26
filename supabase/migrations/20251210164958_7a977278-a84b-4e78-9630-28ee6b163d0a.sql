-- Create maintenance_tasks table
CREATE TABLE public.maintenance_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    frequency_days INTEGER NOT NULL DEFAULT 7,
    next_due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_logs table
CREATE TABLE public.maintenance_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
    completed_by TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for maintenance_tasks (public access for workshop staff)
CREATE POLICY "Anyone can view active tasks" 
ON public.maintenance_tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert tasks" 
ON public.maintenance_tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update tasks" 
ON public.maintenance_tasks 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete tasks" 
ON public.maintenance_tasks 
FOR DELETE 
USING (true);

-- RLS policies for maintenance_logs (public access for workshop staff)
CREATE POLICY "Anyone can view logs" 
ON public.maintenance_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create logs" 
ON public.maintenance_logs 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_maintenance_tasks_updated_at
BEFORE UPDATE ON public.maintenance_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample tasks for demonstration
INSERT INTO public.maintenance_tasks (title, description, frequency_days, next_due_date) VALUES
('Clean CNC Filter', 'Remove and clean the air filter on the CNC machine. Replace if damaged.', 7, CURRENT_DATE),
('Lubricate Lathe Bearings', 'Apply lubricant to all bearing points on the manual lathe.', 14, CURRENT_DATE + INTERVAL '1 day'),
('Check Compressor Oil Level', 'Inspect oil level in the air compressor. Top up if below minimum line.', 3, CURRENT_DATE - INTERVAL '1 day'),
('Inspect Safety Guards', 'Check all machine safety guards are secure and functioning properly.', 30, CURRENT_DATE + INTERVAL '5 days');