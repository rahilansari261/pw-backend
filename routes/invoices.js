const express = require("express");
const router = express.Router();
const authJWT = require("../middleware/authJWT");
const {
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
} = require("../controllers/invoices");

router.route("/new/add").post(authJWT, createInvoice);
router.route("/:id").get(authJWT, getInvoiceDetail);
router.route("/recent").get(authJWT, getRecentInvoiceDetail);
router.route("/cancel/:id").get(authJWT, cancelInvoice);
router.route("/unpaid/:client_id").get(authJWT, getUnpaidInvoice);
router.route("/:page/:perPage/:type").get(authJWT, getPaginatedInvoicesAccoToType);
router.route("/:page/:perPage/:type/:searchStr").get(authJWT, getPaginatedInvoicesAccoToTypeAndSearch);
router.route("/report/:start_date/:end_date").get(authJWT, getInvoicesReportWithDateFilter);
router.route("/:page/:perPage/:start_date/:end_date").get(authJWT, getPaginatedInvoicesWithDateFilter);
router.route("/getall").get(authJWT, getAllInvoices);
router.route("/cancelled").get(authJWT, getAllCancelledInvoices);
router.route("/:searchStr").get(authJWT, getAllInvoicesAccoToSearch);
module.exports = router;
