const mongoose = require('mongoose')

const AccountSchema = new mongoose.Schema({
  client_id: mongoose.Schema.Types.ObjectId,
  client_name: String,
  client_company: String,
  entry_date: Date,
  entry_transaction_number: String,
  entry_remarks: String,
  entry_type: String,
  entry_amount_in: {
    type: Number,
    required: [true, 'Amount In Must be filled'],
  },
  entry_amount_out: {
    type: Number,
    required: [true, 'Amount Out Must be filled'],
  },
  entry_balance: { type: Number },
})
module.exports = AccountSchema
