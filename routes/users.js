const express = require("express");
const router = express.Router();
const authJWT = require("../middleware/authJWT");
const { getUser, createUser, loginUser, forgotUser, verifyUser, resetUser, updateUser, passwordchangeUser, addtaxUser, removeTaxUser, addTandC, salesGraph } = require("../controllers/users");

router.route("/:id").get(authJWT, getUser);
router.route("/register2").post(createUser);
router.route("/login").post(loginUser);
router.route("/forgot").post(forgotUser);
router.route("/verify/:c").get(verifyUser);
router.route("/reset/:c").post(resetUser);
router.route("/update").post(authJWT, updateUser);
router.route("/passwordchange").post(authJWT, passwordchangeUser);
router.route("/settings/addtax").post(authJWT, addtaxUser);
router.route("/settings/removetax/:taxId").get(authJWT, removeTaxUser);
router.route("/settings/addtandc").post(authJWT, addTandC);
router.route("/salesgraph").get(authJWT, salesGraph);
module.exports = router;
