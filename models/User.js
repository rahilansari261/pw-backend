const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  user_company_name: {
    type: String,
    required: [true, 'Company Name Must be filled'],
    unique: true,
  },
  user_name: {
    type: String,
  },
  user_tin: String,
  user_stn: String,
  user_address: {
    type: String,
  },

  user_phone: {
    type: Number,
  },
  user_password: {
    type: String,
    required: [true, 'Password  Must be filled'],
  },
  user_email: {
    type: String,
    validate: {
      validator: function (v) {
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v
        )
      },
      message: 'Email not valid',
    },
    unique: true,
  },

  user_subscriptionStatus: {
    type: Boolean,
    default: true,
  },
  user_verification: {
    type: Boolean,
    default: false,
  },
  user_account: [
    {
      entry_date: {
        type: Date,
        default: Date.now,
      },
      entry_remarks: String,
      entry_amount: {
        type: Number,
        required: [true, 'Amount Must be filled'],
      },
    },
  ],
  user_subscriptionEndDate: Date,
  user_lastModified: {
    type: Date,
  },
  registeredOn: {
    type: Date,
  },
  lastLogin: {
    type: Date,
  },
  user_settings: {
    user_invoice_number: Number,
    user_logo: String,
    user_template: String,
    user_tc: String,
    user_tax: [],
  },
})
module.exports = mongoose.model('User', UserSchema)
