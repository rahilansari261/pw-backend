const express = require('express')
const router = express.Router()
const authJWT = require('../middleware/authJWT')
const {
  createProduct,
  updateProduct,
  removeProduct,
  getProductDetail,
  getProductWithSearchAndPaging,
} = require('../controllers/products')

router.route('/add').post(authJWT,createProduct)
router.route('/update').post(authJWT,updateProduct)
router.route('/remove/:id').get(authJWT,removeProduct)
router.route('/:id').get(authJWT,getProductDetail)
router.route('/:page/:perPage/:searchStr').get(authJWT,getProductWithSearchAndPaging)

module.exports = router
