-- Add category to shop_items
ALTER TABLE public.shop_items 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'High-Tech';

-- Add policies for Admin to manage shop items
CREATE POLICY "Admins can insert shop items" ON public.shop_items FOR INSERT 
WITH CHECK ( EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') );

CREATE POLICY "Admins can update shop items" ON public.shop_items FOR UPDATE 
USING ( EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') );

CREATE POLICY "Admins can delete shop items" ON public.shop_items FOR DELETE 
USING ( EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') );

-- Add policies for Orders (Admin access already exists but ensuring Insert works for users)
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

