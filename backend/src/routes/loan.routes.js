const express = require("express");
const {
  getLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
} = require("../controllers/loan.controller");

const router = express.Router();

router.get("/", getLoans);
router.get("/:id", getLoanById);
router.post("/", createLoan);
router.put("/:id", updateLoan);
router.delete("/:id", deleteLoan);

module.exports = router;
