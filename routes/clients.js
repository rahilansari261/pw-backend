const express = require('express')
const router = express.Router()
const authJWT = require('../middleware/authJWT')
const {
  createClient,
  updateClient,
  removeClient,
  getClientDetail,
  getClientWithSearchAndPaging,
  createClientAccounts,
} = require('../controllers/clients')

router.route('/add').post(authJWT,createClient)
router.route('/update').post(authJWT,updateClient)
router.route('/:id').get(authJWT,getClientDetail)
router.route('/remove/:id').get(authJWT,removeClient)
router.route('/:page/:perPage/:searchStr').get(authJWT,getClientWithSearchAndPaging)
router.route('/sorted/:page/:perPage/:searchStr').get(authJWT,getClientWithSearchAndPaging)
router.route('/accounts').post(authJWT,createClientAccounts)

module.exports = router
