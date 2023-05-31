// const express = require('express')
// const app = express()
const User = require("../models/User");
const passwordHash = require("password-hash");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// const asyncWrapper = require('../middleware/async')
// const { createCustomError } = require('../errors/custom-error')
const getUser = async (req, res) => {
  try {
    const id = req.params.id;
    // prettier-ignore
    if (!id) return res.status(200).json({message: 'User id not provided',data: null,success: false,})
    // prettier-ignore
    const doc = await User.findById({ _id: id })
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    res.status(200).json({ message: 'User Information ', data: doc, success: true })
  } catch (error) {
    console.log(error.message);
    // prettier-ignore
    res.status(200).json({message: error.message,success: false,})
  }
};
const createUser = async (req, res) => {
  try {
    const hashedPassword = passwordHash.generate(req.body.user_password);
    const myDate = new Date();
    myDate.setDate(myDate.getDate() + 14);

    const newUser = {
      _id: require("mongoose").Types.ObjectId(),
      user_company_name: req.body.user_company_name,
      user_name: req.body.user_name,
      user_tin: "",
      user_stn: "",
      user_address: "",
      user_phone: "",
      user_password: hashedPassword,
      user_email: req.body.user_email,
      user_lastModified: new Date(),
      user_subscriptionStatus: true,
      user_verification: false,
      user_subscriptionEndDate: myDate,
      user_settings: {
        user_logo: req.body.user_logo || "default.jpg",
        user_template: req.body.user_template || "default.html",
        user_tc: req.body.user_tc || "",
        user_tax: [
          {
            _id: require("mongoose").Types.ObjectId(),
            type: "VAT",
            rate: 14.5,
          },
          {
            _id: require("mongoose").Types.ObjectId(),
            type: "VAT",
            rate: 5.5,
          },
          {
            _id: require("mongoose").Types.ObjectId(),
            type: "CST",
            rate: 2,
          },
          {
            _id: require("mongoose").Types.ObjectId(),
            type: "No Tax",
            rate: 0,
          },
        ],
      },
      user_account: [
        {
          entry_remarks: "",
          entry_amount: 0,
        },
      ],
    };
    const doc = await User.create(newUser);
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    //prettier-ignore
    res.status(200).json({ message: 'User Added Successfully', data: doc, success: true, })
  } catch (error) {
    res.status(500).json({ msg: error });
  }
};
const loginUser = async (req, res) => {
  try {
    const docs = await User.findOne({ user_email: req.body.user_email });
    //prettier-ignore
    if (!docs) return res.json({ success: false, message: 'Sorry, Email is not registered', })
    else {
      //prettier-ignore
      if (!docs.user_subscriptionStatus) return res.json({ success: false, message: 'Authentication failed. Account Disabled', })
      //prettier-ignore
      if (!docs.user_verification) return res.json({ success: false, message: 'Authentication failed. Account not yet verified', })
      //prettier-ignore
      if (!passwordHash.verify(req.body.user_password, docs.user_password)) return res.json({ success: false, message: 'Authentication failed. Wrong Password', })
      else {
        const now = new Date()
        const payLoad = {
          _id: docs._id,
          email: docs.user_email,
          name: docs.user_name,
          compnay_name: docs.user_company_name,
          subscription: docs.user_subscriptionEndDate,
          create_time: now,
        }

        if (docs.user_subscriptionEndDate >= now) {
          // lastLogin

          const conditions = { _id: docs._id }
          const update = { $set: { lastLogin: new Date() } }
          const options = { multi: false }
          const user = await User.findOneAndUpdate(conditions, update, options)

          const token = jwt.sign(payLoad, process.env.SECRET, {
            expiresIn: '12h', // expires in 12 hours
          })
          docs.user_password = 'YOU ARE LOOKING AT THE WRONG PLACE'
          // req.brute.reset(function () {}) // login Successful
          //prettier-ignore
          res.json({ success: true, message: 'Login Successful', token: token, data: docs, })
        } else {
          const token = jwt.sign(payLoad, process.env.SECRET, {
            expiresIn: '5m', // expires in 12 hours
          })
          //prettier-ignore
          res.json({ success: false, message: 'Subscription expired.', code: 132, token: token, })
        }
      }
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
const forgotUser = async (req, res) => {};
const verifyUser = async (req, res) => {
  try {
    const token = req.params.c;
    // prettier-ignore
    if (!token) return res.status(403).send({ success: false, message: 'No token provided. 2' })
    // decode token
    else {
      // verifies the sceret and checks expiration
      const verifiedToken = jwt.verify(token, app.get('verifySecret'))
      if (!verifiedToken) return res.json({ success: false, message: 'Fail to Authenticate.' })
      else {
        // prettier-ignore-start
        const decoded = jwt.decode(token, { complete: true })
        const id = decoded.payload._id
        const conditions = { _id: require('mongoose').Types.ObjectId(id) }
        const update = { $set: { user_verification: true } }
        const options = { multi: true }

        const numAffected = await User.findOneAndUpdate(conditions, update, options)

        if (!numAffected) console.log(err)
        else {
          // numAffected is the number of updated documents
          if (numAffected.nModified > 0) res.json({ message: 'Account has been verified', success: true, })
          else {
            res.status(403).json({ message: 'Access Unauthorized', success: false })
          }
          // prettier-ignore-end              
        }
      }
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
const resetUser = async (req, res) => {
  const token = req.params.c;
  // prettier-ignore
  if (!token) return res.status(403).send({ success: false, message: 'No token provided. 2' })
  // decode token
  else {
    // verifies the sceret and checks expiration
    jwt.verify(token, app.get('secretForgot'), function (err, decoded) {
      if (err) return res.json({ success: false, message: 'Fail to Authenticate.' })
      else {
        // if everything is good, save to request for use in other routes        
        if (req.body.password != req.body.password2) return res.json({ message: 'Passwords Do Not Match', success: false })
        // prettier-ignore-start
        const decoded = jwt.decode(token, { complete: true })
        const id = decoded.payload._id
        const conditions = { _id: require('mongoose').Types.ObjectId(id) }
        const update = { $set: { user_password: passwordHash.generate(req.body.password) } }
        const options = { multi: false }

        User.updateOne(conditions, update, options, callback)
        function callback(err, numAffected) {
          if (err) console.log(err)
          else {
            // numAffected is the number of updated documents
            if (numAffected.nModified > 0) res.json({ message: 'Password has been reset. Please login using new password.', success: true, })
            else res.status(403).json({ message: 'Access Unauthorized', success: false })
            // prettier-ignore-end              
          }
        }
      }
    })
  }
};
const updateUser = async (req, res) => {
  try {
    const userData = req.body.userData;
    // prettier-ignore
    if (!userData) return res.status(200).json(getFailureResponse('User Data is missing', false))

    const data = await User.findOne({ _id: req.doc._id });
    // prettier-ignore
    if (!data) return res.status(200).json({ message: 'No user found with the given id', success: false, })
    else {
      if (userData.user_name) data.user_name = userData.user_name
      if (userData.user_tin) data.user_tin = userData.user_tin
      if (userData.user_stn) data.user_stn = userData.user_stn
      if (userData.user_address) data.user_address = userData.user_address
      if (userData.user_phone) data.user_phone = userData.user_phone
      if (userData.user_settings && userData.user_settings.user_tc)
        data.user_settings.user_tc = userData.user_settings.user_tc
      data.user_lastModified = Date.now()
      data.save()
      // prettier-ignore
      res.status(200).json({ message: 'User Details Updated Successfully', data: data, success: true, })
    }
  } catch (error) {
    // prettier-ignore
    res.status(200).json({ message: error, success: false, })
  }
};
const passwordchangeUser = async (req, res) => {
  const passwordData = req.body.passwordData;
  // prettier-ignore
  if (!passwordData) return res.status(200).json(getFailureResponse('User Data is missing', false))
  // prettier-ignore
  if (passwordData.new_password != passwordData.confirm_password) return res.json({ success: false, message: 'Password do not match', })

  try {
    const data = await User.findOne({ _id: req.doc._id });
    // prettier-ignore
    if (!passwordHash.verify(passwordData.old_password, data.user_password)) return res.json({ success: false, message: 'Wrong  Old Password' })
    else {
      data.user_password = passwordHash.generate(passwordData.new_password)
      data.save()
      // prettier-ignore
      res.status(200).json({ message: 'Password Has Change, Use your new password to login', success: true, })
    }
  } catch (error) {
    // prettier-ignore
    res.status(500).json({ msg: error })
  }
};
const addtaxUser = async (req, res) => {
  try {
    const userData = req.body.userData;
    // prettier-ignore
    if (!userData) return res.status(200).json(getFailureResponse('User Data is missing', false))
    userData._id = require("mongoose").Types.ObjectId();
    // prettier-ignore
    const docs = await User.updateOne({ _id: req.doc._id, }, { $push: { 'user_settings.user_tax': userData, }, }, { upsert: true, },)
    // prettier-ignore
    res.status(200).json({ message: 'Tax Added Successfully', success: true, data: docs })
  } catch (error) {
    // prettier-ignore
    res.status(400).json({ message: error, success: false, data: null })
  }
};
const removetaxUser = async (req, res) => {
  try {
    // prettier-ignore
    if (!req.body.userData) return res.status(400).json(getFailureResponse('User Data is missing', false))
    const tax_id = require("mongoose").Types.ObjectId(req.params.taxId);
    // prettier-ignore
    User.updateOne({ _id: req.doc._id }, { $pull: { 'user_settings.user_tax': { _id: tax_id } } }, { upsert: true })
    // prettier-ignore
    res.status(200).json({ message: 'Tax Removed Successfully', success: true })
  } catch (error) {
    // prettier-ignore
    res.status(400).json({ message: error, success: false })
  }
};
module.exports = {
  getUser,
  createUser,
  loginUser,
  forgotUser,
  verifyUser,
  resetUser,
  updateUser,
  passwordchangeUser,
  addtaxUser,
  removetaxUser,
};
