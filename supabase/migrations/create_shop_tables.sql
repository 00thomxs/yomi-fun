-- Create Shop Items table
CREATE TABLE public.shop_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  stock INTEGER DEFAULT -1, -- -1 means infinite
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create Orders table
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  item_id UUID REFERENCES public.shop_items(id) NOT NULL,
  price_paid INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  delivery_info TEXT -- JSON or text for address
);

-- Enable RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Shop items are viewable by everyone" ON public.shop_items FOR SELECT USING (true);
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed Data
INSERT INTO public.shop_items (name, description, price, image_url) VALUES
('AirPods Pro', 'Écouteurs sans fil avec réduction de bruit active.', 25000, '/images/shop-airpods.jpg'),
('PlayStation 5', 'Console de jeux nouvelle génération.', 50000, '/images/shop-psn.webp'),
('MacBook Air', 'Léger, puissant, prêt pour tout.', 150000, '/images/shop-macbook.webp'),
('Voyage au Japon', 'Billet A/R pour Tokyo + Hébergement 1 semaine.', 300000, '/images/shop-japan.avif');




