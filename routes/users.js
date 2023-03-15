const express = require('express')
const router = express.Router()
const authJWT = require('../middleware/authJWT')
const {
  helloUser,
  createUser,
  loginUser,
  forgotUser,
  verifyUser,
  resetUser,
  updateUser,
  passwordchangeUser,
  addtaxUser,
  removetaxUser,
} = require('../controllers/users')

router.route('/hello').get(helloUser)
router.route('/register2').post(createUser)
router.route('/login').post(loginUser)
router.route('/forgot').post(forgotUser)
router.route('/verify/:c').get(verifyUser)
router.route('/reset/:c').post(resetUser)
router.route('/update').post(authJWT, updateUser)
router.route('/passwordchange').post(authJWT, passwordchangeUser)
router.route('/settings/addtax').post(authJWT, addtaxUser)
router.route('/settings/removetax/:taxId').get(authJWT, removetaxUser)
module.exports = router
