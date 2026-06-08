DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles;

CREATE POLICY "Users can insert their own roles"
ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roles"
ON public.user_roles
FOR DELETE TO authenticated
USING (auth.uid() = user_id);