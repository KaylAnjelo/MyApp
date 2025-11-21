const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const bcrypt = require('bcrypt'); // for password hashing
const emailService = require('../services/emailService');

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

class AuthController {
  // LOGIN
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return sendError(res, 'Username and password are required', 400);
      }

      // Fetch user by username
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !users) {
        return sendError(res, 'Invalid username or password', 401);
      }

      // Compare password
      const validPassword = await bcrypt.compare(password, users.password);
      if (!validPassword) {
        return sendError(res, 'Invalid username or password', 401);
      }

      await supabase
        .from('user_logs')
        .insert([{
          user_id: users.user_id,
          username: users.username,
          // timestamp: new Date().toISOString(),
        }]);

      return sendSuccess(res, {
        message: 'Login successful',
        user: {
          user_id: users.user_id,
          username: users.username,
          role: users.role,
          store_id: users.store_id || null,  
          first_name: users.first_name || null,
          last_name: users.last_name || null,
          contact_number: users.contact_number || null,
          user_email: users.user_email || null
        }
        // You can add JWT token generation here if needed
      });

    } catch (error) {
      console.error('Login error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // REGISTER
  async register(req, res) {
    try {
      const {
        username,
        password,
        first_name,
        last_name,
        contact_number,
        user_email,
        role = 'customer',
        store_id = null
      } = req.body;

      if (!username || !password) {
        return sendError(res, 'Username and password are required', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into users table
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username,
            password: hashedPassword,
            first_name,
            last_name,
            contact_number,
            user_email,
            role,
            store_id
          }
        ])
        .select()
        .single();

      if (error) {
        return sendError(res, error.message, 400);
      }

      return sendSuccess(
        res,
        {
          message: 'User registered successfully',
          user: {
            user_id: data.user_id,
            username: data.username,
            role: data.role
          }
        },
        201
      );

    } catch (error) {
      console.error('Registration error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // SEND OTP
  async sendOTP(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return sendError(res, 'Email is required', 400);
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_email')
        .eq('user_email', email)
        .single();

      if (existingUser) {
        return sendError(res, 'Email already registered', 400);
      }

      // Normalize email and generate OTP
      const normalizedEmail = String(email).trim().toLowerCase();

      // Generate OTP
      const otp = emailService.generateOTP();
      
      // Store OTP with expiry (10 minutes)
      otpStore.set(normalizedEmail, {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      });

      // Helpful debug: log OTP in dev (REMOVE in production)
      if (process.env.NODE_ENV !== 'production') {
        console.info(`DEV OTP for ${normalizedEmail}:`, otp);
      }

      // Send OTP email
      await emailService.sendOTP(email, otp);

      return sendSuccess(res, {
        message: 'OTP sent to your email',
        email
      });

    } catch (error) {
      console.error('Send OTP error:', error);
      return sendError(res, error.message || 'Failed to send OTP', 500);
    }
  }

  // VERIFY OTP AND REGISTER
  async verifyOTPAndRegister(req, res) {
    try {
      const {
        email,
        otp,
        username,
        password,
        first_name,
        last_name,
        contact_number,
        role = 'customer',
        store_id = null
      } = req.body;

      if (!email || !otp) {
        return sendError(res, 'Email and OTP are required', 400);
      }

      // Check OTP
      const normalizedEmail = String(email).trim().toLowerCase();
      const storedOTP = otpStore.get(normalizedEmail);
      
      if (!storedOTP) {
        return sendError(res, 'OTP not found or expired', 400);
      }

      if (Date.now() > storedOTP.expiresAt) {
        otpStore.delete(normalizedEmail);
        return sendError(res, 'OTP has expired', 400);
      }

      if (storedOTP.otp !== otp) {
        return sendError(res, 'Invalid OTP', 400);
      }

      // OTP verified, proceed with registration
      if (!username || !password) {
        return sendError(res, 'Username and password are required', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into users table
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username,
            password: hashedPassword,
            first_name,
            last_name,
            contact_number,
            user_email: email,
            role,
            store_id
          }
        ])
        .select()
        .single();

      if (error) {
        return sendError(res, error.message, 400);
      }

      // Clear OTP after successful registration
      otpStore.delete(normalizedEmail);

      return sendSuccess(
        res,
        {
          message: 'User registered successfully',
          user: {
            user_id: data.user_id,
            username: data.username,
            role: data.role,
            first_name: data.first_name,
            last_name: data.last_name,
            user_email: data.user_email
          }
        },
        201
      );

    } catch (error) {
      console.error('Verify OTP error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // VERIFY OTP AND REGISTER VENDOR WITH STORE CODE
  async verifyOTPAndRegisterVendor(req, res) {
    try {
      const {
        email,
        otp,
        store_code,
        username,
        password,
        first_name,
        last_name,
        contact_number
      } = req.body;

      if (!email || !otp) {
        return sendError(res, 'Email and OTP are required', 400);
      }

      if (!store_code) {
        return sendError(res, 'Store code is required', 400);
      }

      if (!username || !password) {
        return sendError(res, 'Username and password are required', 400);
      }

      // Verify OTP (normalize email)
      const normalizedEmail = String(email).trim().toLowerCase();
      const storedData = otpStore.get(normalizedEmail);
      if (!storedData) {
        return sendError(res, 'Invalid or expired verification code', 400);
      }

      if (Date.now() > storedData.expiresAt) {
        otpStore.delete(normalizedEmail);
        return sendError(res, 'Verification code has expired', 400);
      }

      if (storedData.otp !== otp) {
        return sendError(res, 'Invalid verification code', 400);
      }

      // Verify store code exists and get store details
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('store_id, store_name, is_active')
        .eq('store_code', store_code)
        .single();

      if (storeError || !store) {
        return sendError(res, 'Invalid store code', 400);
      }

      if (!store.is_active) {
        return sendError(res, 'This store is currently inactive', 400);
      }

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return sendError(res, 'Username already exists', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert vendor user with store_id
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username,
            password: hashedPassword,
            first_name,
            last_name,
            contact_number,
            user_email: email,
            role: 'vendor',
            store_id: store.store_id
          }
        ])
        .select()
        .single();

      if (error) {
        return sendError(res, error.message, 400);
      }

      // Clear OTP after successful registration
      otpStore.delete(normalizedEmail);

      return sendSuccess(
        res,
        {
          message: 'Vendor registered successfully',
          user: {
            user_id: data.user_id,
            username: data.username,
            role: data.role,
            first_name: data.first_name,
            last_name: data.last_name,
            user_email: data.user_email,
            store_id: data.store_id,
            store_name: store.store_name
          }
        },
        201
      );

    } catch (error) {
      console.error('Vendor registration error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // VERIFY STORE CODE AND REGISTER VENDOR (without OTP - kept for compatibility)
  async verifyStoreCodeAndRegister(req, res) {
    try {
      const {
        store_code,
        username,
        password,
        first_name,
        last_name,
        contact_number,
        user_email
      } = req.body;

      if (!store_code) {
        return sendError(res, 'Store code is required', 400);
      }

      if (!username || !password) {
        return sendError(res, 'Username and password are required', 400);
      }

      // Verify store code exists and get store details
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('store_id, store_name, is_active')
        .eq('store_code', store_code)
        .single();

      if (storeError || !store) {
        return sendError(res, 'Invalid store code', 400);
      }

      if (!store.is_active) {
        return sendError(res, 'This store is currently inactive', 400);
      }

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return sendError(res, 'Username already exists', 400);
      }

      // Check if email already exists
      if (user_email) {
        const { data: existingEmail } = await supabase
          .from('users')
          .select('user_email')
          .eq('user_email', user_email)
          .single();

        if (existingEmail) {
          return sendError(res, 'Email already registered', 400);
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert vendor user with store_id
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username,
            password: hashedPassword,
            first_name,
            last_name,
            contact_number,
            user_email,
            role: 'vendor',
            store_id: store.store_id
          }
        ])
        .select()
        .single();

      if (error) {
        return sendError(res, error.message, 400);
      }

      return sendSuccess(
        res,
        {
          message: 'Vendor registered successfully',
          user: {
            user_id: data.user_id,
            username: data.username,
            role: data.role,
            first_name: data.first_name,
            last_name: data.last_name,
            user_email: data.user_email,
            store_id: data.store_id,
            store_name: store.store_name
          }
        },
        201
      );

    } catch (error) {
      console.error('Vendor registration error:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  async logout(req, res) {
    return sendSuccess(res, { message: 'Logged out successfully' });
  }

  async getProfile(req, res) {
    return sendSuccess(res, { message: 'Profile endpoint' });
  }

  // SEND PASSWORD RESET OTP
  async sendPasswordResetOTP(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return sendError(res, 'Email is required', 400);
      }

      // Check if user exists
      const { data: user, error } = await supabase
        .from('users')
        .select('user_id, username, user_email, first_name')
        .eq('user_email', email)
        .single();

      if (error || !user) {
        return sendError(res, 'No account found with this email', 404);
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with 10-minute expiration
      const normalizedEmail = String(email).trim().toLowerCase();

      otpStore.set(normalizedEmail, {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000,
        userId: user.user_id,
        purpose: 'password-reset'
      });

      // Send OTP email
      await emailService.sendOTP(email, otp, user.first_name || user.username);

      return sendSuccess(res, {
        message: 'Password reset OTP sent to your email',
        email: email
      });

    } catch (error) {
      console.error('Send password reset OTP error:', error);
      return sendError(res, 'Failed to send OTP', 500);
    }
  }

  // VERIFY PASSWORD RESET OTP
  async verifyPasswordResetOTP(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return sendError(res, 'Email and OTP are required', 400);
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const stored = otpStore.get(normalizedEmail);

      if (!stored) {
        return sendError(res, 'No OTP request found for this email', 400);
      }

      if (stored.purpose !== 'password-reset') {
        return sendError(res, 'Invalid OTP purpose', 400);
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(email);
        return sendError(res, 'OTP has expired', 400);
      }

      if (stored.code !== otp) {
        return sendError(res, 'Invalid OTP', 400);
      }

      // Generate a temporary token for password change
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store reset token (expires in 15 minutes)
      otpStore.set(`reset_${normalizedEmail}`, {
        token: resetToken,
        userId: stored.userId,
        expiresAt: Date.now() + 15 * 60 * 1000
      });

      // Clear OTP
      otpStore.delete(normalizedEmail);

      return sendSuccess(res, {
        message: 'OTP verified successfully',
        resetToken: resetToken,
        userId: stored.userId
      });

    } catch (error) {
      console.error('Verify password reset OTP error:', error);
      return sendError(res, 'Failed to verify OTP', 500);
    }
  }

  // CHANGE PASSWORD
  async changePassword(req, res) {
    try {
      const { email, resetToken, newPassword } = req.body;

      if (!email || !resetToken || !newPassword) {
        return sendError(res, 'Email, reset token, and new password are required', 400);
      }

      if (newPassword.length < 6) {
        return sendError(res, 'Password must be at least 6 characters long', 400);
      }

      // Verify reset token
      const normalizedEmail = String(email).trim().toLowerCase();
      const stored = otpStore.get(`reset_${normalizedEmail}`);

      if (!stored) {
        return sendError(res, 'Invalid or expired reset token', 400);
      }

      if (stored.token !== resetToken) {
        return sendError(res, 'Invalid reset token', 400);
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(`reset_${normalizedEmail}`);
        return sendError(res, 'Reset token has expired', 400);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in database
      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('user_id', stored.userId);

      if (error) {
        return sendError(res, 'Failed to update password', 500);
      }

      // Clear reset token
      otpStore.delete(`reset_${normalizedEmail}`);

      return sendSuccess(res, {
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      return sendError(res, 'Failed to change password', 500);
    }
  }
}

module.exports = new AuthController();
