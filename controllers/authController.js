const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const bcrypt = require('bcrypt'); // for password hashing

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

  async logout(req, res) {
    return sendSuccess(res, { message: 'Logged out successfully' });
  }

  async getProfile(req, res) {
    return sendSuccess(res, { message: 'Profile endpoint' });
  }
}

module.exports = new AuthController();
