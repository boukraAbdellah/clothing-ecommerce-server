const ShippingOption = require('../models/shipping.model');

async function createShippingOption(req, res) {
  try {
    const shippingOption = await ShippingOption.create(req.body);
    res.json({ shippingOption });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating shipping option' });
  }
}

async function getShippingOptions(req, res) {
  try {
    const options = await ShippingOption.find();
    res.json({ shippingOptions: options });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching shipping options' });
  }
}

async function updateShippingOption(req, res) {
  try {
    const option = await ShippingOption.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!option) return res.status(404).json({ error: 'Shipping option not found' });
    res.json({ shippingOption: option });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating shipping option' });
  }
}

async function deleteShippingOption(req, res) {
  try {
    const option = await ShippingOption.findByIdAndDelete(req.params.id);
    if (!option) return res.status(404).json({ error: 'Shipping option not found' });
    res.json({ message: 'Shipping option deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting shipping option' });
  }
}

async function bulkUpdateShippingOptions(req, res) {
  try {
    const { updates } = req.body; // Array of { id, priceHomeDelivery?, priceOfficeDelivery? }
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }

    const updatePromises = updates.map(async (update) => {
      const { id, ...updateData } = update;
      if (!id) throw new Error('ID is required for each update');
      
      return await ShippingOption.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
    });

    const updatedOptions = await Promise.all(updatePromises);
    res.json({ shippingOptions: updatedOptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating shipping options' });
  }
}

module.exports = {
  createShippingOption,
  getShippingOptions,
  updateShippingOption,
  deleteShippingOption,
  bulkUpdateShippingOptions
};