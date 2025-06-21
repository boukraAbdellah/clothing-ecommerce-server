const Category = require('../models/category.model');
const Media = require('../models/media.model');

async function createCategory(req, res) {
  const { name, slug, imageId } = req.body;
  try {
    const image = imageId ? await Media.findById(imageId) : null;
    const category = await Category.create({
      name,
      slug,
      image,
    });


    res.json({ category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating category' });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await Category.find().populate('image');
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
}

async function updateCategory(req, res) {
  try {
    const { name, slug, imageId } = req.body;
    const categoryId = req.params.id;
    
    // Check if the category exists first
    const existingCategoryToUpdate = await Category.findById(categoryId);
    if (!existingCategoryToUpdate) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Prepare update data
    const updateData = {};
    
    // Only check name uniqueness if name is being updated
    if (name) {
      const existingCategory = await Category.findOne({ 
        name, 
        _id: { $ne: categoryId } 
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          error: `Category with name "${name}" already exists` 
        });
      }
      
      updateData.name = name;
    }
    
    // Add slug to update data if provided
    if (slug) {
      updateData.slug = slug;
    }
    
    // Handle image update if imageId is provided
    if (imageId) {
      const image = await Media.findById(imageId);
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }
      updateData.image = image;
    }
    
    // Update the category
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true }
    ).populate('image');
    
    res.json({ category: updatedCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating category' });
  }
}

async function deleteCategory(req, res) {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting category' });
  }
}

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
};