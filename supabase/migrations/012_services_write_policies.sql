-- Migration: Services Write Policies

-- Allow admins to insert services
CREATE POLICY "Admins can insert services"
    ON public.services
    FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update services
CREATE POLICY "Admins can update services"
    ON public.services
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete services
CREATE POLICY "Admins can delete services"
    ON public.services
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::app_role));
