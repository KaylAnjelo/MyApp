-- Database Schema for Suki App
-- Run these SQL commands in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
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

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    description TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    discount_percentage DECIMAL(5, 2),
    discount_amount DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_rewards table (for tracking redeemed rewards)
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

-- Create points_history table
CREATE TABLE IF NOT EXISTS points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stores policies
CREATE POLICY "Anyone can view active stores" ON stores
    FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can manage their own stores" ON stores
    FOR ALL USING (auth.uid() = vendor_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rewards policies
CREATE POLICY "Anyone can view active rewards" ON rewards
    FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can manage their store rewards" ON rewards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = rewards.store_id 
            AND stores.vendor_id = auth.uid()
        )
    );

-- User rewards policies
CREATE POLICY "Users can view their own rewards" ON user_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reward redemptions" ON user_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Points history policies
CREATE POLICY "Users can view their own points history" ON points_history
    FOR SELECT USING (auth.uid() = user_id);

-- Create functions
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user points when transaction is created
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's total points
    UPDATE profiles 
    SET points = points + NEW.points_earned - COALESCE(NEW.points_used, 0)
    WHERE id = NEW.user_id;
    
    -- Insert into points history
    INSERT INTO points_history (user_id, transaction_id, points_change, reason)
    VALUES (NEW.user_id, NEW.id, NEW.points_earned, 'Transaction completed');
    
    IF NEW.points_used > 0 THEN
        INSERT INTO points_history (user_id, transaction_id, points_change, reason)
        VALUES (NEW.user_id, NEW.id, -NEW.points_used, 'Points used for discount');
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for points update
CREATE TRIGGER update_points_on_transaction
    AFTER INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_user_points();

-- Insert sample data
INSERT INTO profiles (user_id, full_name, email, user_type) VALUES
    ('00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com', 'customer'),
    ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'jane@example.com', 'vendor');

INSERT INTO stores (name, description, address, phone, email, vendor_id) VALUES
    ('Coffee Corner', 'Best coffee in town', '123 Main St, City', '555-0123', 'coffee@example.com', '00000000-0000-0000-0000-000000000002'),
    ('Pizza Palace', 'Delicious pizza and more', '456 Oak Ave, City', '555-0456', 'pizza@example.com', '00000000-0000-0000-0000-000000000002');

INSERT INTO rewards (store_id, title, description, points_required, discount_percentage) VALUES
    ('00000000-0000-0000-0000-000000000001', '10% Off Coffee', 'Get 10% off your next coffee purchase', 100, 10.00),
    ('00000000-0000-0000-0000-000000000002', 'Free Pizza Slice', 'Get a free pizza slice with any order', 500, 0.00);
