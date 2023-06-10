const mongoose = require("mongoose");
const passwordHash = require("password-hash");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// const asyncWrapper = require('../middleware/async')
// const { createCustomError } = require('../errors/custom-error')
const { dateFilter } = require("../utils/utils");
const saleChart = async (date, value, ChartSaleCollection) => {
  try {
    //prettier-ignore
    const months = new Array('Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec')
    const givenDate = new Date(date || Date.now());
    const month = "" + months[givenDate.getMonth()];
    const year = givenDate.getFullYear();

    const monthAndYear = [month, year].join("-");
    const saleData = await ChartSaleCollection.findOne({ month: monthAndYear });

    if (saleData) {
      //prettier-ignore
      const updatedSaleData = await ChartSaleCollection.findOneAndUpdate({ month: monthAndYear },{ $inc: { stats: value } },{ multi: false })
    } else {
      const chart = {
        month: monthAndYear,
        stats: value,
      };
      const createdChartData = await ChartSaleCollection.create(chart);
    }
  } catch (error) {
    // prettier-ignore
    return error;
  }
};
// prettier-ignore
const updateAccounts = async (invoice,AccountCollection,ClientCollection,isAdvance,InvoiceCollection) => {
  try{
  const newAccountEntry = {
    client_id: invoice.client_data.client_id,
    client_name: invoice.client_data.client_name,
    client_company: invoice.client_data.client_company,
    entry_date: invoice.invoice_data.date,
    entry_remarks: `Invoice No ${invoice.invoice_data.number}`,
    entry_type: 'System',
    entry_amount_in: 0,
    entry_amount_out: invoice.invoice_data.grand_total,
  }
  await AccountCollection.create(newAccountEntry)
  // prettier-ignore
  const clientDoc = await ClientCollection.findOneAndUpdate({ _id: newAccountEntry.client_id },{ $inc: { client_balance: newAccountEntry.entry_amount_out } },{ new: true },)

  if (isAdvance) {    
    const client_balance = clientDoc.client_balance 
    if (client_balance >= invoice.invoice_data.grand_total) {
       client_balance = invoice.invoice_data.grand_total * -1
    }
    // prettier-ignore
    const invoiceDoc = await InvoiceCollection.findOneAndUpdate({ _id: invoice._id },{$inc: { 'invoice_data.balance': client_balance * -1 },$push: {'invoice_data.paymentHistory': {dated: new Date(),amount: client_balance,remark: 'Advance Adjusment',},},})
  }
   } catch (error) {
    // prettier-ignore
    return error;
  }
}
const updateCancelAccounts = async (invoice, AccountCollection, ClientCollection) => {
  try {
    const newAccountEntry = {
      client_id: invoice.client_data.client_id,
      client_name: invoice.client_data.client_name,
      client_company: invoice.client_data.client_company,
      entry_date: new Date(),
      entry_remarks: "Cancelled Invoice No " + invoice.invoice_data.number,
      entry_type: "System",
      entry_amount_in: 0,
      entry_amount_out: invoice.invoice_data.grand_total * -1,
    };
    await AccountCollection.create(newAccountEntry);
    // prettier-ignore
    await ClientCollection.findOneAndUpdate({ _id: newAccountEntry.client_id },{ $inc: { client_balance: newAccountEntry.
      entry_amount_out } })
  } catch (error) {
    console.log(error);
  }
};
const createInvoice = async (req, res) => {
  const invoiceData = req.body.invoiceData;
  try {
    // prettier-ignore
    if (!invoiceData) return res.status(200).json({message: ' Data Not Provided',data: null,success: false,})
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    // prettier-ignore
    const ChartSaleCollection = mongoose.model(`${req.doc._id}-chartsale`, require('../models/ChartSale'))
    // prettier-ignore
    const AccountCollection = mongoose.model(`${req.doc._id}-accounts`, require('../models/Account'))
    // prettier-ignore
    const ClientCollection = mongoose.model(`${req.doc._id}-clients`, require('../models/Client'))

    const userDoc = await User.findById(req.doc._id);
    const newInvoice = {
      client_data: {
        client_company_name: invoiceData.client_data.client_company_name,
        client_name: invoiceData.client_data.client_name,
        client_tin: invoiceData.client_data.client_tin,
        client_stn: invoiceData.client_data.client_stn,
        client_address: invoiceData.client_data.client_address,
        client_phone: invoiceData.client_data.client_phone,
        client_email: invoiceData.client_data.client_email,
        client_id: invoiceData.client_data.client_id,
      },
      user_data: {
        user_company_name: invoiceData.user_data.user_company_name,
        user_tin: invoiceData.user_data.user_tin,
        user_stn: invoiceData.user_data.user_stn,
        user_address: invoiceData.user_data.user_address,
        user_phone: invoiceData.user_data.user_phone,
        user_logo: invoiceData.user_data.user_logo,
        user_tc: invoiceData.user_data.user_tc,
      },
      invoice_data: {
        number: invoiceData.invoice_data.number,
        taxTotal: invoiceData.invoice_data.taxTotal,
        grand_total: invoiceData.invoice_data.grand_total,
        balance: invoiceData.invoice_data.grand_total,
        sub_total: invoiceData.invoice_data.subtotal,
        discount: invoiceData.invoice_data.discount,
        date: new Date(invoiceData.invoice_data.date),
        tax_summary: [],
        status: true,
      },
      product_data: [],
    };

    for (let i = 0; i < invoiceData.product_data.length; i++) {
      newInvoice.product_data.push({
        product_name: invoiceData.product_data[i].product_name,
        product_desc: invoiceData.product_data[i].product_description,
        qty: invoiceData.product_data[i].qty,
        product_price: invoiceData.product_data[i].product_price,
        product_unit: invoiceData.product_data[i].product_unit,
        discount: invoiceData.product_data[i].discount,
        tax_name: invoiceData.product_data[i].tax_name,
        tax_rate: invoiceData.product_data[i].tax_rate,
        tax_amount: invoiceData.product_data[i].tax_amount,
        row_total: invoiceData.product_data[i].row_total,
      });
      newInvoice.invoice_data.tax_summary.push({
        tax_name: invoiceData.product_data[i].tax_name,
        tax_rate: invoiceData.product_data[i].tax_rate,
        tax_amount: invoiceData.product_data[i].tax_amount,
      });
    }

    if (!userDoc.user_settings.user_invoice_number) {
      newInvoice.invoice_data.number = 1;
    } else {
      newInvoice.invoice_data.number = userDoc.user_settings.user_invoice_number + 1;
    }
    const createdInvoice = await InvoiceCollection.create(newInvoice);
    // prettier-ignore
    if (!createdInvoice) return res.status(200).json({ message: error, data: null, success: false })

    // prettier-ignore
    const userData = await User.findOneAndUpdate({ _id: req.doc._id },{ $inc: { 'user_settings.user_invoice_number': 1 } })
    // prettier-ignore
    if (!userData) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    await saleChart(newInvoice.invoice_data.date, newInvoice.invoice_data.grand_total, ChartSaleCollection)
    // prettier-ignore
    await updateAccounts(newInvoice, AccountCollection, ClientCollection, invoiceData.invoice_data.advancePayment, InvoiceCollection)
    // prettier-ignore
    res.status(200).json({message: 'invoice Added Successfully',data: createdInvoice, success: true,})
  } catch (error) {
    console.log(error);
    res.status(200).json({ message: error, data: null, success: false });
  }
};
const getInvoiceDetail = async (req, res) => {
  try {
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    // prettier-ignore
    const doc = await InvoiceCollection.findById({_id: req.params.id})
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    res.status(200).json({message: 'Invoice details',data: doc, success: true,})
  } catch (error) {
    res.status(200).json({ message: error, data: null, success: false });
  }
};
const getRecentInvoiceDetail = async (req, res) => {
  try {
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    // prettier-ignore
    const doc = await InvoiceCollection.find({ 'invoice_data.status': true }).select({ 'invoice_data.date': 1 }).sort({ 'invoice_data.date': -1 }).skip(0).limit(1).exec()
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    res.status(200).json({message: 'Last invoice details',data: doc, success: true,})
  } catch (error) {
    res.status(200).json({ message: error, data: null, success: false });
  }
};
const cancelInvoice = async (req, res) => {
  try {
    const id = req.params.id;
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    // prettier-ignore
    const ChartSaleCollection = mongoose.model(`${req.doc._id}-chartsale`, require('../models/ChartSale'))
    // prettier-ignore
    const AccountCollection = mongoose.model(`${req.doc._id}-accounts`, require('../models/Account'))
    // prettier-ignore
    const ClientCollection = mongoose.model(`${req.doc._id}-clients`, require('../models/Client'))
    // prettier-ignore
    const invoiceData = await InvoiceCollection.findOneAndUpdate({ _id: id },{'invoice_data.status': false})
    // prettier-ignore
    if (!invoiceData) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    await saleChart(invoiceData.invoice_data.date, -invoiceData.invoice_data.grand_total, ChartSaleCollection)
    // prettier-ignore
    await updateCancelAccounts(invoiceData, AccountCollection, ClientCollection)
    // prettier-ignore
    res.status(200).json({message: 'invoice Cancelled  Successfully',data: invoiceData, success: true,})
  } catch (error) {
    console.log(error);
    res.status(200).json({ message: error.msg, data: null, success: false });
  }
};
const getUnpaidInvoice = async (req, res) => {
  try {
    const client_id = req.params.client_id;
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    const doc = await InvoiceCollection.find({
      $and: [{ "invoice_data.status": true }, { "client_data.client_id": client_id }, { "invoice_data.balance": { $gt: 0 } }],
    })
      .select({
        _id: 1,
        client_data: 1,
        "invoice_data.number": 1,
        "invoice_data.date": 1,
        "invoice_data.grand_total": 1,
        "invoice_data.balance": 1,
      })
      .sort({ "invoice_data.date": 1 })
      .exec();
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    res.status(200).json({message: 'Un-Paid invoice details',data: doc, success: true,})
  } catch (error) {
    res.status(200).json({ message: error, data: null, success: false });
  }
};
const getPaginatedInvoicesAccoToType = async (req, res) => {
  try {
    let { page, perPage, type } = req.params;
    let findOptions = {};
    // prettier-ignore
    if (isNaN(page) || isNaN(perPage)) return res.status(200).json({message: 'Pagin Error',data: null,success: false,})
    page = parseInt(page);
    perPage = parseInt(perPage);
    const startingPageForSort = (page - 1) * perPage;

    if (type === "All") findOptions = {};
    else if (type === "Cancel") findOptions = { "invoice_data.status": false };
    else if (type === "Paid")
      findOptions = {
        $and: [{ "invoice_data.balance": 0 }, { "invoice_data.status": true }],
      };
    else if (type === "Pending")
      findOptions = {
        $and: [{ "invoice_data.balance": { $gt: 0 } }, { "invoice_data.status": true }],
      };

    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    const doc = await InvoiceCollection.find(findOptions)
      .select({
        _id: 1,
        "client_data.client_company_name": 1,
        "client_data.client_name": 1,
        "invoice_data.number": 1,
        "invoice_data.date": 1,
        "invoice_data.status": 1,
        "invoice_data.grand_total": 1,
        "invoice_data.balance": 1,
      })
      .sort({ _id: -1 })
      .skip(startingPageForSort)
      .limit(perPage)
      .exec();
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // console.log(data);
    const noOfInvoice = await InvoiceCollection.countDocuments(findOptions);
    // prettier-ignore
    res.status(200).json({message: `Invoices after according to ${type} filter.`,data: doc, count :noOfInvoice, success: true,})
  } catch (error) {
    console.log(error);
    res.status(200).json({ message: error, data: null, success: false });
  }
};
const getPaginatedInvoicesAccoToTypeAndSearch = async (req, res) => {
  try {
    let { page, perPage, type, searchStr } = req.params;
    let findOptions = {};
    // prettier-ignore
    if (isNaN(page) || isNaN(perPage)) return res.status(200).json({message: 'Pagin Error',data: null,success: false,})
    page = parseInt(page);
    perPage = parseInt(perPage);
    const startingPageForSort = (page - 1) * perPage;

    if (type === "All") findOptions = {};
    else if (type === "Cancel") findOptions = { "invoice_data.status": false };
    else if (type === "Paid")
      findOptions = {
        $and: [{ "invoice_data.balance": 0 }, { "invoice_data.status": true }],
      };
    else if (type === "Pending")
      findOptions = {
        $and: [{ "invoice_data.balance": { $gt: 0 } }, { "invoice_data.status": true }],
      };
    let num;
    if (!isNaN(searchStr)) {
      num = parseInt(searchStr);
    }
    const searchOptions = {
      $or: [
        {
          "invoice_data.number": num,
        },
        {
          "client_data.client_company_name": new RegExp(searchStr, "i"),
        },
        {
          "client_data.client_name": new RegExp(searchStr, "i"),
        },
        {
          "client_data.client_phone": num,
        },
      ],
    };

    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    // prettier-ignore
    const doc = await InvoiceCollection.find({$and: [findOptions, searchOptions],})
      .select({
        _id: 1,
        'client_data.client_company_name': 1,
        'client_data.client_name': 1,
        'invoice_data.number': 1,
        'invoice_data.date': 1,
        'invoice_data.status': 1,
        'invoice_data.grand_total': 1,
        'invoice_data.balance': 1,
      })
      .skip(startingPageForSort)
      .limit(perPage)
      .exec()
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    const noOfInvoice = await InvoiceCollection.count({$and: [findOptions, searchOptions],})
    // prettier-ignore
    res.status(200).json({message: `Invoices after according to ${type} filter and search term - ${searchStr}`,data: doc, count :noOfInvoice, success: true,})
  } catch (error) {
    res.status(200).json({ message: error, data: null, success: false });
  }
};
const getInvoicesReportWithDateFilter = async (re, res) => {
  try {
    // prettier-ignore
    const { startDate, endDate } = await dateFilter(req.params.start_date,req.params.end_date)
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    // prettier-ignore
    const doc = InvoiceCollection.find({'invoice_data.date': {$gte: startDate,$lt: endDate,},})
    .select({ _id: 1, 'client_data.client_company_name': 1, invoice_data: 1 })
    .exec()
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    res.status(200).json({message: `Invoices after date filter`,data: doc, success: true,})
  } catch (error) {
    res.status(200).json({ message: error, data: null, success: false });
  }
};
const getPaginatedInvoicesWithDateFilter = async (req, res) => {
  try {
    let { page, perPage, start_date, end_date } = req.params;
    // prettier-ignore
    if (isNaN(page) || isNaN(perPage)) return res.status(200).json({message: 'Pagin Error',data: null,success: false,})
    page = parseInt(page);
    perPage = parseInt(perPage);
    const startingPageForSort = (page - 1) * perPage;
    // prettier-ignore
    const { startDate, endDate } = await dateFilter(start_date,end_date)
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    // prettier-ignore
    const doc = InvoiceCollection.find({'invoice_data.date': {$gte: startDate,$lt: endDate,},})
    .skip(startingPageForSort)
    .limit(perPage)
    .exec()
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    const noOfInvoice = await InvoiceCollection.count({'invoice_data.date': {$gte: startDate,$lt: endDate,},})
    // prettier-ignore
    res.status(200).json({message: `Invoices after date filter`,data: doc, count :noOfInvoice, success: true,})
  } catch (error) {
    res.status(200).json({ message: error, data: null, success: false });
  }
};
const getAllInvoices = async (req, res) => {
  try {
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    // prettier-ignore
    const doc = await InvoiceCollection.find({}).sort({'invoice_data.date': -1,}).exec()
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    const noOfInvoice = await InvoiceCollection.count()
    // prettier-ignore
    res.status(200).json({message: `All Invoices `,data: doc, count :noOfInvoice, success: true,})
  } catch (error) {
    res.status(200).json({ message: error, data: null, success: false });
  }
};
const getAllCancelledInvoices = async (req, res) => {
  try {
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    // prettier-ignore
    const doc = await InvoiceCollection.find({'invoice_data.status': false,}).exec()
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    const noOfInvoice = await InvoiceCollection.count({'invoice_data.status': false,}).exec()
    // prettier-ignore
    res.status(200).json({message: `Showing cancelled invoices `,data: doc, count :noOfInvoice, success: true,})
  } catch (error) {
    res.status(200).json({ message: error, data: null, success: false });
  }
};
const getAllInvoicesAccoToSearch = async (req, res) => {
  try {
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`, require('../models/Invoice'))
    // prettier-ignore
    const doc = await InvoiceCollection.find({
      $and: [
        {
          $or: [
            {
              'invoice_data.number': new RegExp(req.params.searchStr, 'i'),
            },
            {
              'client_data.client_company_name': new RegExp(
                req.params.searchStr,
                'i'
              ),
            },
            {
              'client_data.client_name': new RegExp(req.params.searchStr, 'i'),
            },
            {
              'client_data.client_phone': new RegExp(req.params.searchStr, 'i'),
            },
          ],
        },
      ],
    }).exec()
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    res.status(200).json({message: `Showing all cancelled invoices `,data: doc, count :doc.length, success: true,})
  } catch (error) {
    res.status(200).json({ message: error, data: null, success: false });
  }
};
module.exports = {
  createInvoice,
  getInvoiceDetail,
  getRecentInvoiceDetail,
  cancelInvoice,
  getUnpaidInvoice,
  getPaginatedInvoicesAccoToType,
  getPaginatedInvoicesAccoToTypeAndSearch,
  getInvoicesReportWithDateFilter,
  getPaginatedInvoicesWithDateFilter,
  getAllInvoices,
  getAllCancelledInvoices,
  getAllInvoicesAccoToSearch,
};
