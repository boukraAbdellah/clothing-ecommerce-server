const Order = require('../models/order.model');
const ShippingOption = require('../models/shipping.model');
const Product = require('../models/product.model');

async function createOrder(req, res) {
  try {
    const { customerName, customerPhone, customerAddress, state, products, shippingMethod, shippingPrice } = req.body;

    let shippingCost = shippingPrice; // Use provided shipping price if available
    
    if (!shippingPrice) {
      const shipping = await ShippingOption.findOne({ state });
      if (!shipping) return res.status(404).json({ error: 'Shipping option not found' });
      
      // Map the shipping method values to the correct field names
      // "home" → priceHomeDelivery, "office" → priceOfficeDelivery
      shippingCost = shippingMethod === 'office' || shippingMethod === 'toOffice' ? 
        shipping.priceOfficeDelivery : shipping.priceHomeDelivery;
    }

    // Calculate products total
    let productsTotal = 0;
    for (let item of products) {
      const p = await Product.findById(item.product);
      if (!p) return res.status(404).json({ error: `Product not found: ${item.product}` });
      productsTotal += p.price * (item.quantity || 1);
    }

    const totalPrice = productsTotal + (shippingCost || 0);

    const order = await Order.create({
      customerName,
      customerPhone,
      customerAddress,
      state,
      city: req.body.city || 'Unknown', // Default to 'Unknown' if city is not provided
      products,
      shippingMethod,
      shippingCost,
      totalPrice,
      status: 'Pending'
    });

    res.json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating order', details: error.message });
  }
}

async function getOrders(req, res) {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Date filter
    if (req.query.date) {
      const startDate = new Date(req.query.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(req.query.date);
      endDate.setHours(23, 59, 59, 999);
      
      filter.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    
    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { customerName: searchRegex },
        { customerPhone: searchRegex }
      ];
    }
    
    // Count total documents for pagination metadata
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);
    
    // Fetch orders with pagination and filters
    let ordersQuery = Order.find(filter)
      .populate({
        path: "products.product",
        select: "title price thumbnail",
        populate: {
          path: "thumbnail",
          model: "Media",
          select: "url",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    let orders = await ordersQuery;
    
    // If searching by product title, filter after population
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      orders = orders.filter(order => {
        const matchesCustomer = order.customerName.toLowerCase().includes(searchTerm) ||
              order.customerPhone.includes(searchTerm);
        
        const matchesProduct = order.products.some(item => 
          item.product && item.product.title && 
          item.product.title.toLowerCase().includes(searchTerm)
        );
        
        return matchesCustomer || matchesProduct;
      });
    }
    
    // Return orders with pagination metadata
    res.json({
      orders,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching orders' });
  }
}

async function getTodayOrders(req, res) {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Set up date range for today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    const dateFilter = {
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    };
    
    // Count total documents for pagination metadata
    const totalOrders = await Order.countDocuments(dateFilter);
    const totalPages = Math.ceil(totalOrders / limit);
    
    // Fetch today's orders with pagination
    const orders = await Order.find(dateFilter)
      .populate({
        path: "products.product",
        select: "title price thumbnail",
        populate: {
          path: "thumbnail",
          model: "Media",
          select: "url",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Return orders with pagination metadata
    res.json({
      orders,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching today\'s orders' });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.id).populate('products.product');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching order' });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )
    .populate({
      path: "products.product",
      select: "title price thumbnail",
      populate: {
        path: "thumbnail",
        model: "Media",
        select: "url",
      },
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating order status' });
  }
}

async function deleteOrder(req, res) {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting order' });
  }
}

module.exports = {
  createOrder,
  getOrders,
  getTodayOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
};