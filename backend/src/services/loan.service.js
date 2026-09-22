const { randomUUID } = require("crypto");

const loans = [];

function validateLoanData(loanData) {
  const { borrower, amount, interestRate, termMonths } = loanData;

  if (!borrower || typeof borrower !== "string" || !borrower.trim()) {
    const error = new Error("borrower is required");
    error.status = 400;
    throw error;
  }
  if (typeof amount !== "number" || amount < 0) {
    const error = new Error("amount must be a non-negative number");
    error.status = 400;
    throw error;
  }
  if (typeof interestRate !== "number" || interestRate < 0) {
    const error = new Error("interestRate must be a non-negative number");
    error.status = 400;
    throw error;
  }
  if (!Number.isInteger(termMonths) || termMonths < 1) {
    const error = new Error("termMonths must be a positive whole number");
    error.status = 400;
    throw error;
  }
  if (
    !["pending", "approved", "rejected"].includes(loanData.status ?? "pending")
  ) {
    const error = new Error("status must be pending, approved, or rejected");
    error.status = 400;
    throw error;
  }
}

function findLoanIndex(id) {
  const index = loans.findIndex((loan) => loan._id === id);
  if (index === -1) {
    const error = new Error("Loan not found");
    error.status = 404;
    throw error;
  }
  return index;
}

async function getLoans() {
  return loans;
}

async function getLoanById(id) {
  return loans[findLoanIndex(id)];
}

async function createLoan(loanData) {
  validateLoanData(loanData);

  const now = new Date().toISOString();
  const loan = {
    _id: randomUUID(),
    borrower: loanData.borrower.trim(),
    amount: loanData.amount,
    interestRate: loanData.interestRate,
    termMonths: loanData.termMonths,
    status: loanData.status ?? "pending",
    createdAt: now,
    updatedAt: now,
  };

  loans.push(loan);
  return loan;
}

async function updateLoan(id, loanData) {
  const index = findLoanIndex(id);
  const updatedLoan = { ...loans[index], ...loanData };
  validateLoanData(updatedLoan);
  updatedLoan.borrower = updatedLoan.borrower.trim();
  updatedLoan.updatedAt = new Date().toISOString();
  loans[index] = updatedLoan;
  return updatedLoan;
}

async function deleteLoan(id) {
  const index = findLoanIndex(id);
  const [deletedLoan] = loans.splice(index, 1);
  return deletedLoan;
}

module.exports = {
  getLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
};
