-- =========================================
-- Create Tables
-- =========================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    user_type TEXT CHECK (user_type IN ('customer', 'vendor')),
    points INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT true,
    vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    description TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
    points_used INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points history table
CREATE TABLE IF NOT EXISTS points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- Insert Dummy Data (fixed)
-- =========================================

-- 1. Profiles
INSERT INTO profiles (id, user_id, full_name, email, phone, user_type)
VALUES
('11111111-1111-1111-1111-111111111111', '2984e2e4-5821-4749-b98a-968005364daf', 'John Doe', 'john@example.com', '09171234567', 'customer'),
('22222222-2222-2222-2222-222222222222', 'cb496a0f-9d52-4cd0-9607-44e71895a225', 'Jane Smith', 'jane@example.com', '09179876543', 'vendor');

-- 2. Stores
INSERT INTO stores (id, name, description, address, phone, email, vendor_id)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coffee Corner', 'Best coffee in town', '123 Main St, City', '555-0123', 'coffee@example.com', '22222222-2222-2222-2222-222222222222'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Pizza Palace', 'Delicious pizza and more', '456 Oak Ave, City', '555-0456', 'pizza@example.com', '22222222-2222-2222-2222-222222222222');

-- 3. Rewards
INSERT INTO rewards (id, user_id, store_id, title, description, points_required, discount_percentage)
VALUES
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '10% Off Coffee', 'Get 10% off your next coffee purchase', 100, 10.00),
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Free Pizza Slice', 'Get a free pizza slice with any order', 500, 0.00);

-- 4. Transactions
INSERT INTO transactions (id, user_id, store_id, amount, points_earned, points_used, description, status)
VALUES
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 150.00, 15, 0, 'Bought 1 coffee', 'completed'),
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 500.00, 50, 20, 'Bought pizza', 'completed');

-- 5. User Rewards
INSERT INTO user_rewards (id, user_id, reward_id, points_used)
VALUES
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 100),
('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 500);

-- 6. Points History
INSERT INTO points_history (id, user_id, transaction_id, points_change, reason)
VALUES
('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 15, 'Transaction completed'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 50, 'Transaction completed'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', -20, 'Points used for discount');
