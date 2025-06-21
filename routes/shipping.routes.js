const express = require('express');
const router = express.Router();
const { 
  createShippingOption, 
  getShippingOptions, 
  updateShippingOption, 
  deleteShippingOption,
  bulkUpdateShippingOptions
} = require('../controllers/shipping.controller');

// Shipping routes
router.post('/', createShippingOption);
router.get('/', getShippingOptions);
router.put('/bulk-update', bulkUpdateShippingOptions);
router.put('/:id', updateShippingOption);
router.delete('/:id', deleteShippingOption);

module.exports = router;