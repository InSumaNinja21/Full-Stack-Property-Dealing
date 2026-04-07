const Property = require("../models/Property");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Add Property
exports.addProperty = async (req, res) => {
  try {
    const property = new Property(req.body);
    const saved = await property.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Properties (optional query: location, minPrice, maxPrice, search)
exports.getProperties = async (req, res) => {
  try {
    const { location, minPrice, maxPrice, search } = req.query;
    const filter = {};

    if (location != null && String(location).trim()) {
      const loc = String(location).trim();
      filter.location = { $regex: escapeRegex(loc), $options: "i" };
    }

    const min = minPrice !== undefined && String(minPrice).trim() !== "" ? Number(minPrice) : NaN;
    const max = maxPrice !== undefined && String(maxPrice).trim() !== "" ? Number(maxPrice) : NaN;

    if (!Number.isNaN(min)) {
      filter.price = { ...filter.price, $gte: min };
    }
    if (!Number.isNaN(max)) {
      filter.price = { ...filter.price, $lte: max };
    }

    if (search != null && String(search).trim()) {
      const term = String(search).trim();
      const pattern = { $regex: escapeRegex(term), $options: "i" };
      filter.$or = [
        { title: pattern },
        { description: pattern },
        { location: pattern }
      ];
    }

    const properties = await Property.find(filter);
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Property

exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Property
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Property
exports.updateProperty = async (req, res) => {
  try {
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // return updated document
    );

    if (!updatedProperty) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json(updatedProperty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};