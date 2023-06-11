const mongoose = require("mongoose");
const passwordHash = require("password-hash");
require("dotenv").config();
const jwt = require("jsonwebtoken");
// const asyncWrapper = require('../middleware/async')
// const { createCustomError } = require('../errors/custom-error')
const { dateFilter } = require("../utils/utils");
// <!-- two api remaining getAll and 1 in getAccountDetails function that is commented -->

const updateInvoices = async (accountData, InvoiceCollection) => {
  for (const i = 0; i < accountData.invoice_list.length; i++) {
    await InvoiceCollection.updateOne(
      { _id: accountData.invoice_list[i]._id },
      {
        $inc: {
          "invoice_data.balance": accountData.invoice_list[i].amount * -1,
        },
        $push: {
          "invoice_data.paymentHistory": {
            dated: new Date(),
            amount: accountData.invoice_list[i].amount,
            remark: accountData.entry_transaction_number,
          },
        },
      }
    );
  }
};

const createAccount = async (req, res) => {
  try {
    const accountData = req.body.accountData;
    // prettier-ignore
    if (!accountData) return res.status(200).json({ message: ' Data Not Found', data: null, success: false })
    // prettier-ignore
    const AccountCollection = mongoose.model(`${req.doc._id}-accounts`,require('../models/Account'))
    // prettier-ignore
    const ClientCollection = mongoose.model(`${req.doc._id}-clients`,require('../models/Client'))
    // prettier-ignore
    const InvoiceCollection = mongoose.model(`${req.doc._id}-invoices`,require('../models/Invoice'))
    const newAccount = {
      client_id: accountData.client_id,
      client_name: accountData.client_name,
      client_company: accountData.client_company,
      entry_date: new Date(accountData.entry_date),
      entry_remarks: accountData.entry_remarks,
      entry_transaction_number: accountData.entry_transaction_number,
      entry_type: accountData.entry_type,
      entry_amount_in: accountData.entry_amount_in,
      entry_amount_out: accountData.entry_amount_out,
      // "entry_balance": accountData.entry_balance
    };
    const doc = await AccountCollection.create(newAccount);
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    else {
      // prettier-ignore
      await ClientCollection.updateOne({ _id: accountData.client_id },{ $inc: { client_balance: accountData.entry_amount_in * -1 } })
    }
    if (accountData.entry_amount_in > 0) await updateInvoices(accountData, InvoiceCollection);
    // prettier-ignore
    return res.status(200).json({message: 'Account Update Successfully',data: doc,success: true})
  } catch (error) {
    // prettier-ignore
    res.status(200).json({message: error,success: false,})
  }
};
const getFindAndSortOptionsAccoToParams = async (client_id, searchString, start_date, end_date) => {
  let findAndSortOptions = {};
  // if (start_date != 'no-start-date' && end_date != 'no-end-date') {
  //   let { startDate, endDate } = await dateFilter(start_date, end_date)
  // }
  // 1-> getting accounts with date filter and paging
  if (client_id === "no-id" && searchString === "no-search" && start_date != "no-start-date" && end_date != "no-end-date") {
    const { startDate, endDate } = await dateFilter(start_date, end_date);
    findAndSortOptions.findOptions = {
      entry_date: {
        $gte: startDate,
        $lt: endDate,
      },
    };
    findAndSortOptions.sortOptions = {
      _id: -1,
    };
  }
  // 2-> getting accounts of a client(client_id) and with search string and paging
  else if (start_date === "no-start-date" && end_date === "no-end-date" && client_id != "no-id" && searchString != "no-search") {
    findAndSortOptions.findOptions = {
      $and: [{ entry_remarks: new RegExp(req.params.searchString, "i") }, { client_id: id }],
    };
    findAndSortOptions.sortOptions = { entry_date: -1 };
  }
  // 3-> getting accounts of a client(client_id) and paging
  else if (start_date === "no-start-date" && end_date === "no-end-date" && client_id != "no-id") {
    findAndSortOptions.findOptions = { client_id: client_id };
    findAndSortOptions.sortOptions = { entry_date: -1 };
  }
  // 4-> getting accounts of a client(client_id) with date filter and paging  (TYPICAL)
  // else if (
  //   start_date != 'no-start-date' &&
  //   end_date != 'no-end-date' &&
  //   client_id != 'no-id' &&
  //   searchString === 'no-search'
  // ) {
  //   findAndSortOptions.findOptions = {
  //     $and: [
  //       { entry_date: { $gte: startDate, $lt: endDate } },
  //       { client_id: id },
  //     ],
  //   }
  //   findAndSortOptions.sortOptions = { entry_date: -1 }
  // }

  // 5-> getting accounts with search filter and paging
  else if (start_date === "no-start-date" && end_date === "no-end-date" && client_id === "no-id" && searchString != "no-search") {
    findAndSortOptions.findOptions = {
      $and: [
        {
          $or: [
            {
              account_name: new RegExp(req.params.searchStr, "i"),
            },
            {
              account_company: new RegExp(req.params.searchStr, "i"),
            },
          ],
        },
      ],
    };
    findAndSortOptions.sortOptions = { entry_date: -1 };
  }

  // 6-> getting accounts of a client(client_id) with search and date filter and paging
  else if (start_date != "no-start-date" && end_date != "no-end-date" && client_id != "no-id" && searchString != "no-search") {
    const { startDate, endDate } = await dateFilter(start_date, end_date);
    findAndSortOptions.findOptions = {
      $and: [
        {
          $or: [{ entry_remarks: new RegExp(req.params.searchString, "i") }],
        },
        { entry_date: { $gte: startDate, $lte: endDate } },
        { client_id: id },
      ],
    };
    findAndSortOptions.sortOptions = { entry_date: -1 };
  }
  // 7-> getting accounts with no search filter and paging
  else if (start_date === "no-start-date" && end_date === "no-end-date" && client_id === "no-id" && searchString === "no-search") {
    console.log("yaha pr hu");
    findAndSortOptions.findOptions = {};
    findAndSortOptions.sortOptions = { entry_date: -1 };
  }
  return findAndSortOptions;
};
const getAccountDetails = async (req, res) => {
  console.log("numuste");
  try {
    // prettier-ignore
    let { client_id, searchString, page, perPage, start_date, end_date } = req.params
    // prettier-ignore
    if (isNaN(page) || isNaN(perPage)) return res.status(200).json({message: 'Pagin Error',data: null,success: false,})
    page = parseInt(page);
    perPage = parseInt(perPage);
    const startingPageForSort = (page - 1) * perPage;
    // prettier-ignore
    const AccountCollection = mongoose.model(`${req.doc._id}-accounts`, require('../models/Account' ) )
    // prettier-ignore
    const { findOptions, sortOptions } = await getFindAndSortOptionsAccoToParams(client_id,searchString,start_date,end_date)
    // prettier-ignore
    const docs = await AccountCollection.find(findOptions).sort(sortOptions).skip(startingPageForSort).limit(perPage).exec()
    // prettier-ignore
    if(!docs) return res.status(200).json({message: 'Something went wrong',count: null,data: null,success: false,})
    // prettier-ignore
    res.status(200).json({message: 'Accounts after search',count: docs.length,data: docs,success: true,})
  } catch (error) {
    console.log(error);
    // prettier-ignore
    res.status(200).json({message: error.msg,success: false})
  }
};

module.exports = {
  createAccount,
  getAccountDetails,
};
