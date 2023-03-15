const express = require('express')
const app = express()
const users = require('./routes/users')
const accounts = require('./routes/accounts')
const products = require('./routes/products')
const clients = require('./routes/clients')
const invoices = require('./routes/invoices')
const connectDB = require('./db/connect')
require('dotenv').config()
const notFound = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')

// variables
app.set('superSecret', process.env.SECRET)

// middleware
app.use(express.static('./public'))
app.use(express.json())

// routes
app.use('/api/v1/users', users)
app.use('/api/v1/accounts', accounts)
app.use('/api/v1/products', products)
app.use('/api/v1/clients', clients)
app.use('/api/v1/invoices', invoices)

app.use(notFound)
app.use(errorHandlerMiddleware)
const port = process.env.PORT || 5001

const init = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    )
  } catch (error) {
    console.log(error)
  }
}

init()
