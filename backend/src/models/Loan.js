const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    borrower: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0,
    },
    termMonths: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "termMonths must be a whole number",
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Loan", loanSchema);
