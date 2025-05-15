const mongoose = require('mongoose');
const Product = require('../models/Product');
const Bon = require('../models/Bon');

const productController = {
  // Create multiple products with an optional bon
  createProduct: async (req, res) => {
    try {
      console.log('Raw Body:', req.body);
      console.log('File:', req.file);

      const { DateBon, type, nameSupplier, products } = req.body;

      // Validate required fields
      if (!DateBon || !nameSupplier || !products) {
        return res.status(400).json({ message: "DateBon, fournisseur et produits sont requis" });
      }

      // Parse products if it's a string (from FormData)
      let productsData = typeof products === 'string' ? JSON.parse(products) : products;
      console.log('Parsed Products:', productsData);

      // Ensure productsData is an array
      productsData = Array.isArray(productsData) ? productsData : [productsData];

      // Validate and transform product data
      const validatedProducts = productsData.map((product) => {
        if (!product.nameProduct || !product.priceForOne || !product.quantity || !product.zoneId || !product.expirationDate) {
          throw new Error("Tous les champs requis du produit (nameProduct, priceForOne, quantity, zoneId, expirationDate) doivent être fournis");
        }

        const priceForOne = parseFloat(product.priceForOne);
        const quantity = parseInt(product.quantity);
        const amount = parseFloat(product.amount) || priceForOne * quantity; // Calculate amount if not provided
        const safetyThreshold = product.safetyThreshold ? parseInt(product.safetyThreshold) : undefined;

        if (isNaN(priceForOne) || priceForOne < 0) throw new Error("Le prix unitaire doit être un nombre valide non négatif");
        if (isNaN(quantity) || quantity < 0) throw new Error("La quantité doit être un entier valide non négatif");
        if (isNaN(amount) || amount < 0) throw new Error("Le montant doit être un nombre valide non négatif");
        if (safetyThreshold !== undefined && (isNaN(safetyThreshold) || safetyThreshold < 0)) {
          throw new Error("Le seuil de sécurité doit être un entier valide non négatif");
        }

        return {
          nameProduct: product.nameProduct,
          priceForOne,
          quantity,
          amount,
          unity: product.unity || "unit",
          safetyThreshold,
          zoneId: product.zoneId,
          expirationDate: new Date(product.expirationDate),
          nameSupplier: [nameSupplier], // Store as array for consistency
          bons: [],
          numeroBielle: product.numeroBielle || undefined // Include numeroBielle if provided
        };
      });

      // Save products to the database
      const savedProducts = await Product.insertMany(validatedProducts);

      // Handle bon upload if provided
      if (req.file) {
        const bon = new Bon({
          image: `/uploads/${req.file.filename}`,
          type: type || 'Bon de livraison',
          DateBon: new Date(DateBon),
          productId: savedProducts[0]._id, // Link to the first product
        });
        const savedBon = await bon.save();

        // Update all saved products with the bon reference
        await Product.updateMany(
          { _id: { $in: savedProducts.map(p => p._id) } },
          { $push: { bons: savedBon._id } }
        );

        savedProducts.forEach(product => product.bons.push(savedBon._id));
      }

      res.status(201).json({
        message: "Produits créés avec succès",
        data: savedProducts,
      });
    } catch (error) {
      console.error('Erreur dans createProduct:', error.message, error.stack);
      res.status(500).json({ 
        message: "Une erreur s'est produite !",
        error: error.message,
      });
    }
  },

  // Get all products with populated zone and bons
  getAllProducts: async (req, res) => {
    try {
      const products = await Product.find()
        .populate('zoneId', 'zoneName') // Populate only zoneName for efficiency
        .populate('bons', 'image type DateBon'); // Populate relevant bon fields
      res.status(200).json(products);
    } catch (error) {
      console.error('Erreur dans getAllProducts:', error.message, error.stack);
      res.status(500).json({ message: 'Erreur lors de la récupération des produits', error: error.message });
    }
  },

  // Get a single product by ID
  getProductById: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id)
        .populate('zoneId', 'zoneName')
        .populate('bons', 'image type DateBon');
      if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
      res.status(200).json(product);
    } catch (error) {
      console.error('Erreur dans getProductById:', error.message, error.stack);
      res.status(500).json({ message: 'Erreur lors de la récupération du produit', error: error.message });
    }
  },

  // Update an existing product
  updateProduct: async (req, res) => {
    try {
      const existingProduct = await Product.findById(req.params.id);
      if (!existingProduct) return res.status(404).json({ message: 'Produit non trouvé' });

      const updateData = {
        nameProduct: req.body.nameProduct || existingProduct.nameProduct,
        priceForOne: req.body.priceForOne ? parseFloat(req.body.priceForOne) : existingProduct.priceForOne,
        quantity: req.body.quantity ? parseInt(req.body.quantity) : existingProduct.quantity,
        amount: req.body.amount ? parseFloat(req.body.amount) : existingProduct.amount,
        unity: req.body.unity || existingProduct.unity,
        safetyThreshold: req.body.safetyThreshold ? parseInt(req.body.safetyThreshold) : existingProduct.safetyThreshold,
        zoneId: req.body.zoneId || existingProduct.zoneId,
        nameSupplier: req.body.nameSupplier
          ? (typeof req.body.nameSupplier === 'string' ? JSON.parse(req.body.nameSupplier) : req.body.nameSupplier)
          : existingProduct.nameSupplier,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : existingProduct.expirationDate,
        numeroBielle: req.body.numeroBielle !== undefined ? req.body.numeroBielle : existingProduct.numeroBielle,
        bons: existingProduct.bons, // Preserve existing bons by default
      };

      // Recalculate amount if priceForOne or quantity changes
      if (req.body.priceForOne || req.body.quantity) {
        updateData.amount = updateData.priceForOne * updateData.quantity;
      }

      // Handle new bon upload
      if (req.file && req.body.DateBon) {
        const newBon = new Bon({
          image: `/uploads/${req.file.filename}`,
          type: req.body.type || 'Bon de livraison',
          DateBon: new Date(req.body.DateBon),
          productId: req.params.id,
          supplier: req.body.bonSupplier || null, // Include the supplier from the frontend
        });
        const savedBon = await newBon.save();

        // Check if we should replace the bons array or append to it
        if (req.body.replaceBons === "true") {
          // Replace the bons array with only the new bon
          updateData.bons = [savedBon._id];
        } else {
          // Append the new bon to the existing bons array (original behavior)
          updateData.bons = [...existingProduct.bons, savedBon._id];
        }
      }

      const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate('zoneId', 'zoneName')
        .populate('bons', 'image type DateBon supplier'); // Populate supplier field too
      res.status(200).json(product);
    } catch (error) {
      console.error('Erreur dans updateProduct:', error.message, error.stack);
      res.status(400).json({ message: 'Erreur lors de la mise à jour du produit', error: error.message });
    }
  },

  // Delete a product and its associated bons
  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Produit non trouvé' });

      // Delete associated bons
      await Bon.deleteMany({ productId: product._id });
      await Product.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: 'Produit et bons associés supprimés avec succès' });
    } catch (error) {
      console.error('Erreur dans deleteProduct:', error.message, error.stack);
      res.status(500).json({ message: 'Erreur lors de la suppression du produit', error: error.message });
    }
  },

  // Get products by zone ID
  getProductsByZone: async (req, res) => {
    try {
      const products = await Product.find({ zoneId: req.params.zoneId })
        .populate('bons', 'image type DateBon');
      res.status(200).json(products);
    } catch (error) {
      console.error('Erreur dans getProductsByZone:', error.message, error.stack);
      res.status(500).json({ message: 'Erreur lors de la récupération des produits par zone', error: error.message });
    }
  },

  // Add quantity to an existing product
  addQuantity: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Produit non trouvé' });

      const additionalQuantity = parseInt(req.body.quantity);
      if (isNaN(additionalQuantity) || additionalQuantity <= 0) {
        return res.status(400).json({ message: 'Valeur de quantité invalide' });
      }

      const updateData = {
        quantity: product.quantity + additionalQuantity,
        amount: product.priceForOne * (product.quantity + additionalQuantity),
      };

      if (req.body.expirationDate) {
        updateData.expirationDate = new Date(req.body.expirationDate);
      }
      if (req.body.nameSupplier) {
        updateData.nameSupplier = [...(product.nameSupplier || []), req.body.nameSupplier];
      }
      if (req.body.numeroBielle !== undefined) {
        updateData.numeroBielle = req.body.numeroBielle;
      }

      // Handle new bon upload
      if (req.file && req.body.DateBon) {
        const newBon = new Bon({
          image: `/uploads/${req.file.filename}`,
          type: req.body.type || 'Bon de livraison',
          DateBon: new Date(req.body.DateBon),
          productId: product._id,
        });
        const savedBon = await newBon.save();
        updateData.bons = [...(product.bons || []), savedBon._id];
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('zoneId', 'zoneName')
       .populate('bons', 'image type DateBon');

      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error('Erreur dans addQuantity:', error.message, error.stack);
      res.status(400).json({ 
        message: 'Erreur lors de l\'ajout de quantité', 
        error: error.message 
      });
    }
  },

  // Search bons by DateBon
  searchBonByDeliveryDate: async (req, res) => {
    try {
      const { DateBon } = req.query;
      if (!DateBon) {
        return res.status(400).json({ message: 'DateBon est requis' });
      }

      const searchDate = new Date(DateBon);
      const bons = await Bon.find({
        DateBon: { $eq: searchDate }
      }).populate({
        path: 'productId',
        populate: { path: 'zoneId', select: 'zoneName' }
      });

      // Transform results for compatibility
      const results = bons.map(bon => ({
        ...bon.productId.toObject(),
        DateBon: [bon.DateBon],
        bon: [bon.image],
        nameSupplier: bon.productId.nameSupplier || [],
      }));

      res.status(200).json(results);
    } catch (error) {
      console.error('Erreur dans searchBonByDeliveryDate:', error.message, error.stack);
      res.status(500).json({ 
        message: 'Erreur lors de la recherche de bon par DateBon', 
        error: error.message 
      });
    }
  }
};

module.exports = productController;