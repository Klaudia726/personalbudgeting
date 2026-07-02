-- ==========================================
-- 1. MEMBERSIHKAN OBJEK LAMA (JIKA ADA)
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==========================================
-- 2. MEMBUAT TABEL-TABEL (Langkah 3)
-- ==========================================

-- Tabel profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  monthly_budget NUMERIC(15,2) DEFAULT 2500000.00 CHECK (monthly_budget >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabel categories (Sudah ditambahkan kolom "limit")
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  "limit" NUMERIC(15,2) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabel transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  description TEXT NULL
);

-- ==========================================
-- 3. MEMBUAT AUTOMATIC ONBOARDING TRIGGER (Langkah 4)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profil baru
  INSERT INTO public.profiles (id, full_name, monthly_budget)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Tenant Baru'),
    2500000.00 -- Anggaran bawaan
  );
  
  -- Insert kategori bawaan otomatis beserta limitnya agar cocok dengan program
  INSERT INTO public.categories (user_id, name, type, "limit") VALUES
    (new.id, 'Makanan', 'expense', 1500000),
    (new.id, 'Transportasi', 'expense', 500000),
    (new.id, 'Belanja', 'expense', 1000000),
    (new.id, 'Gaji', 'income', NULL),
    (new.id, 'Investasi', 'income', NULL);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. AKTIVASI RLS DAN SECURITY POLICIES (Langkah 5)
-- ==========================================

-- Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk tabel PROFILES
CREATE POLICY "Tenants can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Tenants can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Kebijakan untuk tabel CATEGORIES
CREATE POLICY "Tenants can view their own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenants can insert their own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can update their own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can delete their own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Kebijakan untuk tabel TRANSACTIONS
CREATE POLICY "Tenants can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenants can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenants can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);
