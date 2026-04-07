const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  image: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);