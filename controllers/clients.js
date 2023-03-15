const mongoose = require('mongoose')

// <!-- sorting condition will be added later -->

const createClient = async (req, res) => {
  try {
    const clientData = req.body.clientData
    // prettier-ignore
    if (!clientData) return res.status(200).json({message: 'Client Data is missing',data: null,success: false,})
    // prettier-ignore
    const ClientCollection = mongoose.model(`${req.doc._id}-clients`, require('../models/Client'))

    const newClient = {
      client_company_name: clientData.client_company_name,
      client_name: clientData.client_name,
      client_tin: clientData.client_tin,
      client_stn: clientData.client_stn,
      client_address: clientData.client_address,
      client_phone: clientData.client_phone,
      client_email: clientData.client_email,
      client_notes: clientData.client_notes,
      client_status: true,
      client_lastModified: new Date(),
      client_balance: 0.0,
    }

    const doc = await ClientCollection.create(newClient)
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    res.status(200).json({ message: 'Client Added Successfully', data: doc, success: true })
  } catch (error) {
    // prettier-ignore
    res.status(200).json({message: error,success: false,})
  }
}

const updateClient = async (req, res) => {
  try {
    const clientData = req.body.clientData
    // prettier-ignore
    if (!clientData) return res.status(200).json({message: 'Client Data is missing',data: null,success: false,})
    // prettier-ignore
    const ClientCollection = mongoose.model(`${req.doc._id}-clients`, require('../models/Client'))
    const doc = await ClientCollection.findOne({ _id: clientData._id })
    // prettier-ignore
    if (!doc) return res.status(200).json({message: 'Client Data Not Found',data: null,success: false,})

    else {
     doc.client_company_name = clientData.client_company_name
     doc.client_name = clientData.client_name
     doc.client_tin = clientData.client_tin
     doc.client_stn = clientData.client_stn
     doc.client_address = clientData.client_address
     doc.client_phone = clientData.client_phone
     doc.client_email = clientData.client_email
     doc.client_notes = clientData.client_notes
     doc.client_status = true
     doc.client_lastModified = new Date()

    await doc.save()
    // prettier-ignore
    res.status(200).json({ message: 'Client Updated Successfully', data: doc, success: true })
   }
  } catch (error) {
    // prettier-ignore
    res.status(200).json({message: error,success: false})
  }
}

const getClientDetail = async (req, res) => {
  
  try {
    // const id = req.params.id
    const id = '634968dd99b9a3eae2e556d6'
    // prettier-ignore
    if (!id) return res.status(200).json({message: 'Client id not provided',data: null,success: false,})
    // prettier-ignore
    const ClientCollection = mongoose.model(`${req.doc._id}-clients`, require('../models/Client'))
    // prettier-ignore
    const doc = await ClientCollection.findById({ _id: id })
    console.log('haan ji......' + req.params.id + doc)
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    res.status(200).json({ message: 'Client Information ', data: doc, success: true })
  } catch (error) {
    console.log("yaha pa r g")
    console.log(error.message)
    // prettier-ignore
    res.status(200).json({message: error.message,success: false,})
  }
}

const removeClient = async (req, res) => {
  try {
    const id = req.params.id
    // prettier-ignore
    if (!id) return res.status(200).json({message: 'Id not provided',data: null,success: false,})
    // prettier-ignore
    const ClientCollection = mongoose.model(`${req.doc._id}-clients`, require('../models/Client'))
    // prettier-ignore
    const doc = await ClientCollection.findOneAndUpdate({ _id: req.params.id },{ client_status: false })
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    res.status(200).json({ message: 'Client Deleted Successfully', data: doc, success: true })
  } catch (error) {
    // prettier-ignore
    res.status(200).json({message: error,success: false,})
  }
}

const getClientWithSearchAndPaging = async (req, res) => {  
  try {
    // prettier-ignore
    let { page, perPage, searchStr } = req.params
    let findOptions = { client_status: true }
    let sortOptions = {}
    // prettier-ignore
    if (isNaN(page) || isNaN(perPage)) return res.status(200).json({message: 'Pagin Error',data: null,success: false,})
    page = parseInt(page)
    perPage = parseInt(perPage)
    const startingPageForSort = (page - 1) * perPage
    // prettier-ignore
    const ClientCollection = mongoose.model(`${req.doc._id}-clients`, require('../models/Client' ) )
    // sorting condition will be added later
    if (req.params.sorting === 'sorting') sortOptions = { client_balance: -1 }
    if (searchStr != 'All') {
      findOptions = {
        $and: [
          { client_status: true },
          {
            $or: [
              { client_company_name: new RegExp(searchStr, 'i') },
              { client_name: new RegExp(searchStr, 'i') },
              { client_address: new RegExp(searchStr, 'i') },
              { client_phone: new RegExp(searchStr, 'i') },
            ],
          },
        ],
      }
    }
    // prettier-ignore
    const clients = await ClientCollection.find(findOptions).sort(sortOptions).exec()
    // prettier-ignore
    if(!clients) return res.status(200).json({message: 'Something went wrong',count: null,data: null,success: false,})    
    const totalClients = clients.length
    // prettier-ignore
    const query =  ClientCollection.find(findOptions).sort(sortOptions).skip(startingPageForSort).limit(perPage)
    const docs = await query.exec()
    // prettier-ignore
    if(!docs) return res.status(200).json({message: 'Something went wrong',count: null,data: null,success: false,})
    // prettier-ignore
    res.status(200).json({message: 'Clients after search',count: totalClients,data: docs,success: true,})
  } catch (error) {
    console.log(error)
    // prettier-ignore
    res.status(400).json({message: error,success: false})
  }
}

const createClientAccounts = async (req, res) => {
  try {
    let accounts = req.body.accounts
    // prettier-ignore
    if (!accounts) return res.status(200).json({message: 'Data not provided',data: null,success: false,})
    // prettier-ignore
    const AccountCollection = mongoose.model(`${req.doc._id}-accounts`, require('../models/Account' ) )
    const newAccounts = accounts.map((account) => {
      return {
        ...account,
        _id: require('mongoose').Types.ObjectId(),
        entry_date: new Date(),
      }
    })
    const doc = await AccountCollection.create(newAccounts)
    // prettier-ignore
    if (!doc) return res.status(200).json({ message: error, data: null, success: false })
    // prettier-ignore
    res.status(200).json({ message: 'Accounts inserted Successfully', data: doc, success: true })
  } catch (error) {
    // prettier-ignore
    res.status(200).json({message: error,success: false,})
  }
}
module.exports = {
  createClient,
  updateClient,
  getClientDetail,
  removeClient,
  getClientWithSearchAndPaging,
  createClientAccounts,
}
