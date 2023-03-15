const mongoose = require('mongoose')

const ReloginSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  timestamp: Date,
})
module.exports = mongoose.model('Relogin', ReloginSchema)
