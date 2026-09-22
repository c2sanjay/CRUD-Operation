const loanService = require("../services/loan.service");

async function getLoans(req, res, next) {
  try {
    res.json(await loanService.getLoans());
  } catch (err) {
    next(err);
  }
}

async function getLoanById(req, res, next) {
  try {
    res.json(await loanService.getLoanById(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function createLoan(req, res, next) {
  try {
    const loan = await loanService.createLoan(req.body);
    res.status(201).json(loan);
  } catch (err) {
    next(err);
  }
}

async function updateLoan(req, res, next) {
  try {
    res.json(await loanService.updateLoan(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function deleteLoan(req, res, next) {
  try {
    res.json(await loanService.deleteLoan(req.params.id));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
};
