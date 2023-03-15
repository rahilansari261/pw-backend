const express = require('express')
const router = express.Router()
const authJWT = require('../middleware/authJWT')
const { createAccount, getAccountDetails } = require('../controllers/accounts')

router.route('/add').post(authJWT, createAccount)
router
  .route('/:client_id/:searchString/:page/:perPage/:start_date/:end_date')
  .get(authJWT, getAccountDetails)

module.exports = router
