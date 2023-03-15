const mongoose = require('mongoose')

const InvoiceSchema = new mongoose.Schema({
  //_id : mongoose.Type.ObjectId();
  client_data: {
    client_id: mongoose.Schema.Types.ObjectId,
    client_company_name: {
      type: String,
      required: [true, 'Company Name Must be filled'],
    },
    // client_company_name : String,
    client_name: { type: String, required: [true, 'Name Must be filled'] },
    // client_name : String,
    client_tin: String,
    client_stn: String,
    client_address: {
      type: String,
      required: [true, 'Address  Must be filled'],
    },
    // client_address : String,
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
      },
    },
  },
  user_data: {
    user_company_name: {
      type: String,
      required: [true, 'Company Name Must be filled'],
    },
    user_tin: String,
    user_stn: String,
    user_address: { type: String },
    user_phone: { type: Number },
    user_logo: String,
    user_tc: String,
  },
  product_data: [
    {
      product_id: mongoose.Schema.Types.ObjectId,
      product_name: String,
      product_desc: String,
      product_unit: String,
      qty: Number,
      product_price: Number,
      discount: Number,
      tax_name: String,
      tax_rate: Number,
      tax_amount: Number,
      row_total: Number,
    },
  ],
  invoice_data: {
    number: Number, // Serial Number of that Financial Year
    date: Date,
    taxTotal: Number,
    total: Number,
    discount: Number,
    sub_total: Number,
    grand_total: Number,
    tax_summary: [{ tax_name: String, tax_amount: Number }],
    balance: Number,
    paymentHistory: [
      {
        id: mongoose.Schema.Types.ObjectId,
        dated: Date,
        amount: Number,
        remark: String,
      },
    ],
    //total: Number ,
    status: Boolean, // live and cancelled invoivces.
  },
})

module.exports = InvoiceSchema
