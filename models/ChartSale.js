const mongoose = require('mongoose')

const ChartSaleSchema = new mongoose.Schema({
  month: { type: String, required: true, unique: true },
  stats: { type: Number, required: true },
})

module.exports = ChartSaleSchema