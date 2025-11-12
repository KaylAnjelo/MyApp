const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

class ProductController {
  // GET all products
  async getAllProducts(req, res) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          product_name,
          price,
          store_id,
          product_type,
          product_image,
          stores (
            store_name,
            location
          )
        `)
        .order('product_name', { ascending: true });

      if (error) {
        return sendError(res, error.message, 400);
      }

      return sendSuccess(res, { products: data });
    } catch (error) {
      console.error('Error fetching products:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // GET products by store_id
  async getProductsByStore(req, res) {
    try {
      const { storeId } = req.params;

      if (!storeId) {
        return sendError(res, 'Store ID is required', 400);
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          product_name,
          price,
          store_id,
          product_type,
          product_image
        `)
        .eq('store_id', storeId)
        .order('product_name', { ascending: true });

      if (error) {
        return sendError(res, error.message, 400);
      }

      return sendSuccess(res, { products: data });
    } catch (error) {
      console.error('Error fetching products by store:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // GET single product by ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          product_name,
          price,
          store_id,
          product_type,
          product_image,
          stores (
            store_name,
            location
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return sendError(res, 'Product not found', 404);
      }

      return sendSuccess(res, { product: data });
    } catch (error) {
      console.error('Error fetching product:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // CREATE new product
  async createProduct(req, res) {
    try {
      const {
        product_name,
        price,
        store_id,
        product_type,
        product_image
      } = req.body;

      if (!product_name || !price || !store_id) {
        return sendError(res, 'Product name, price, and store ID are required', 400);
      }

      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            product_name,
            price,
            store_id,
            product_type,
            product_image
          }
        ])
        .select()
        .single();

      if (error) {
        return sendError(res, error.message, 400);
      }

      return sendSuccess(res, {
        message: 'Product created successfully',
        product: data
      }, 201);
    } catch (error) {
      console.error('Error creating product:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // UPDATE product
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const {
        product_name,
        price,
        product_type,
        product_image
      } = req.body;

      const updateData = {};
      if (product_name !== undefined) updateData.product_name = product_name;
      if (price !== undefined) updateData.price = price;
      if (product_type !== undefined) updateData.product_type = product_type;
      if (product_image !== undefined) updateData.product_image = product_image;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return sendError(res, error.message, 400);
      }

      return sendSuccess(res, {
        message: 'Product updated successfully',
        product: data
      });
    } catch (error) {
      console.error('Error updating product:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }

  // DELETE product
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        return sendError(res, error.message, 400);
      }

      return sendSuccess(res, { message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      return sendError(res, 'Internal server error', 500);
    }
  }
}

module.exports = new ProductController();
