const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: [true, 'Product Name Must be filled'],
    unique: true,
  },
  product_code: {
    type: String,
    unique: true,
    required: [true, 'code Must be filled'],
  },
  product_description: String,
  product_status: Boolean,
  product_price: { type: Number, default: 0.0 },
  product_tax: {},
  product_unit: { type: String, default: 'Nos' },
})

module.exports = ProductSchema
