const mongoose = require('mongoose');
const Sortie = require('../models/Sortie');
const Product = require('../models/Product');
const Bon = require('../models/Bon');


// Create a Sortie
exports.createSortie = async (req, res) => {
  try {
    const { date, chefName, products } = req.body;
    let parsedProducts = typeof products === 'string' ? JSON.parse(products) : products;

    // Validate input
    if (!date || !parsedProducts || !Array.isArray(parsedProducts) || parsedProducts.length === 0) {
      return res.status(400).json({ message: "Date and at least one product with valid quantity are required" });
    }

    // Validate and prepare product updates
    const productUpdates = [];
    for (const product of parsedProducts) {
      const { productId, quantity, productName } = product;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: `Invalid product ID: ${productId}` });
      }
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: `Quantity must be greater than 0 for product ${productName || productId}` });
      }

      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: `Product with ID ${productId} not found` });
      }
      if (existingProduct.quantity < quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for ${existingProduct.nameProduct}. Available: ${existingProduct.quantity}, Requested: ${quantity}` 
        });
      }

      productUpdates.push({
        productId,
        quantity: parseInt(quantity),
        productName: existingProduct.nameProduct,
      });
    }

    // Create the Sortie record first to get its ID
    const sortie = new Sortie({
      date: new Date(date),
      chefName: chefName || "",
      products: productUpdates,
    });
    const savedSortie = await sortie.save();

    // Create Bon if an image is uploaded, linking it to the Sortie
    let bonId = null;
    if (req.file) {
      const newBon = new Bon({
        image: `/uploads/${req.file.filename}`, // Path matches multer config
        type: 'Bon de sortie',
        DateBon: new Date(date),
        sortieId: savedSortie._id,
      });
      const savedBon = await newBon.save();
      bonId = savedBon._id;

      // Update the Sortie with the bonId
      savedSortie.bonId = bonId;
      await savedSortie.save();
    }

    // Update product quantities and amounts atomically
    await Promise.all(
      productUpdates.map(async (update) => {
        const updatedProduct = await Product.findByIdAndUpdate(
          update.productId,
          [
            { $set: { quantity: { $subtract: ['$quantity', update.quantity] } } },
            { $set: { amount: { $multiply: ['$priceForOne', '$quantity'] } } }
          ],
          { new: true, runValidators: true }
        );
        if (!updatedProduct) {
          throw new Error(`Failed to update product ${update.productId}`);
        }
      })
    );

    // Populate the response
    const populatedSortie = await Sortie.findById(savedSortie._id)
      .populate('products.productId')
      .populate('bonId');
    res.status(201).json({ message: "Sortie created successfully", data: populatedSortie });
  } catch (error) {
    console.error('Error in createSortie:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      file: req.file,
    });
    res.status(500).json({ message: "Error creating sortie", error: error.message });
  }
};

// Get All Sorties
exports.getAllSorties = async (req, res) => {
  try {
    const sorties = await Sortie.find()
      .populate('products.productId')
      .populate('bonId');
    res.status(200).json(sorties);
  } catch (error) {
    console.error('Error in getAllSorties:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching sorties', error: error.message });
  }
};

// Get a Single Sortie by ID
exports.getSortieById = async (req, res) => {
  try {
    const sortieId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(sortieId)) {
      return res.status(400).json({ message: "Invalid Sortie ID" });
    }

    const sortie = await Sortie.findById(sortieId)
      .populate('products.productId')
      .populate('bonId');

    if (!sortie) {
      return res.status(404).json({ message: "Sortie not found" });
    }

    res.status(200).json(sortie);
  } catch (error) {
    console.error('Error in getSortieById:', error.message, error.stack);
    res.status(500).json({ message: "Error fetching sortie", error: error.message });
  }
};

// Update a Sortie
exports.updateSortie = async (req, res) => {
  try {
    const { date, chefName, products } = req.body;
    let parsedProducts = typeof products === 'string' ? JSON.parse(products) : products;
    const sortieId = req.params.id;

    // Validate input
    if (!parsedProducts || !Array.isArray(parsedProducts) || parsedProducts.length === 0) {
      return res.status(400).json({ message: "At least one product with valid quantity is required" });
    }

    // Fetch existing sortie
    const existingSortie = await Sortie.findById(sortieId).populate('products.productId');
    if (!existingSortie) {
      return res.status(404).json({ message: "Sortie not found" });
    }

    // Revert previous product quantities
    await Promise.all(
      existingSortie.products.map(async (oldProduct) => {
        await Product.findByIdAndUpdate(
          oldProduct.productId,
          [
            { $set: { quantity: { $add: ['$quantity', oldProduct.quantity] } } },
            { $set: { amount: { $multiply: ['$priceForOne', '$quantity'] } } }
          ],
          { new: true }
        );
      })
    );

    // Validate and prepare new product updates
    const productUpdates = [];
    for (const product of parsedProducts) {
      const { productId, quantity, productName } = product;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: `Invalid product ID: ${productId}` });
      }
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: `Quantity must be greater than 0 for product ${productName || productId}` });
      }

      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: `Product with ID ${productId} not found` });
      }
      if (existingProduct.quantity < quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for ${existingProduct.nameProduct}. Available: ${existingProduct.quantity}, Requested: ${quantity}` 
        });
      }

      productUpdates.push({
        productId,
        quantity,
        productName: existingProduct.nameProduct,
      });
    }

    // Update or create Bon if an image is provided
    const newDate = date ? new Date(date) : existingSortie.date;
    let bonId = existingSortie.bonId;
    if (req.file) {
      if (bonId) {
        await Bon.findByIdAndUpdate(bonId, {
          image: `/uploads/${req.file.filename}`,
          DateBon: newDate,
          sortieId: sortieId,
        });
      } else {
        const newBon = new Bon({
          image: `/uploads/${req.file.filename}`,
          type: 'Bon de sortie',
          DateBon: newDate,
          sortieId: sortieId,
        });
        const savedBon = await newBon.save();
        bonId = savedBon._id;
      }
    } else if (bonId && date) {
      // If no new file but date changes, update DateBon
      await Bon.findByIdAndUpdate(bonId, { DateBon: newDate });
    }

    // Update the Sortie
    const updatedSortie = await Sortie.findByIdAndUpdate(
      sortieId,
      {
        date: newDate,
        chefName: chefName !== undefined ? chefName : existingSortie.chefName,
        products: productUpdates,
        bonId,
      },
      { new: true, runValidators: true }
    );

    // Apply new quantity changes
    await Promise.all(
      productUpdates.map(async (update) => {
        const updatedProduct = await Product.findByIdAndUpdate(
          update.productId,
          [
            { $set: { quantity: { $subtract: ['$quantity', update.quantity] } } },
            { $set: { amount: { $multiply: ['$priceForOne', '$quantity'] } } }
          ],
          { new: true, runValidators: true }
        );
        if (!updatedProduct) {
          throw new Error(`Failed to update product ${update.productId}`);
        }
      })
    );

    // Populate the response
    const populatedSortie = await Sortie.findById(updatedSortie._id)
      .populate('products.productId')
      .populate('bonId');
    res.status(200).json({ message: "Sortie updated successfully", data: populatedSortie });
  } catch (error) {
    console.error('Error in updateSortie:', error.message, error.stack);
    res.status(500).json({ message: "Error updating sortie", error: error.message });
  }
};

// Delete a Sortie
exports.deleteSortie = async (req, res) => {
  try {
    const sortieId = req.params.id;

    // Fetch the sortie to delete
    const sortie = await Sortie.findById(sortieId).populate('products.productId');
    if (!sortie) {
      return res.status(404).json({ message: "Sortie not found" });
    }

    // Restore product quantities
    await Promise.all(
      sortie.products.map(async (product) => {
        const updatedProduct = await Product.findByIdAndUpdate(
          product.productId,
          [
            { $set: { quantity: { $add: ['$quantity', product.quantity] } } },
            { $set: { amount: { $multiply: ['$priceForOne', '$quantity'] } } }
          ],
          { new: true, runValidators: true }
        );
        if (!updatedProduct) {
          throw new Error(`Failed to restore product ${product.productId}`);
        }
      })
    );

    // Delete associated Bon if it exists
    if (sortie.bonId) {
      await Bon.findByIdAndDelete(sortie.bonId);
    }

    // Delete the Sortie
    await Sortie.findByIdAndDelete(sortieId);

    res.status(200).json({ message: "Sortie deleted successfully" });
  } catch (error) {
    console.error('Error in deleteSortie:', error.message, error.stack);
    res.status(500).json({ message: "Error deleting sortie", error: error.message });
  }
};

module.exports = exports;