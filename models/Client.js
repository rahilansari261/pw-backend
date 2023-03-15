const mongoose = require('mongoose')

const ClientSchema = new mongoose.Schema({
  client_company_name: {
    type: String,
    required: [true, 'Company Name Must be filled'],
    unique: true,
  },
  client_name: { type: String, required: [true, 'Name Must be filled'] },
  client_tin: String,
  client_stn: String,
  client_address: {
    type: String,
    required: [true, 'Address  Must be filled'],
  },
  client_phone: {
    type: Number,
    validate: {
      validator: function (v) {
        return /[1-9]/g.test(v)
      },
      message: 'Phone Number not valid',
    },
  },
  client_email: {
    type: String,
    validate: {
      validator: function (v) {
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v
        )
      },
      message: 'Email not valid',
    },
  },
  client_notes: String,
  client_status: Boolean,
  client_lastModified: { type: Date, default: Date.now },
  client_account: [
    {
      entry_date: { type: Date, default: Date.now },
      entry_remarks: String,
      entry_amount: {
        type: Number,
        required: [true, 'Amount Must be filled'],
      },
      entry_type: { type: Number, default: 1 },
      entry_balance: {
        type: Number,
        required: [true, 'Balance Must be filled'],
      },
    },
  ],
})

module.exports = ClientSchema
