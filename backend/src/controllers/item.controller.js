const itemService = require("../services/item.service");

async function getItems(req, res, next) {
  try {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      category,
      minPrice,
      maxPrice,
    } = req.query;

    const result = await itemService.getItems({
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      category,
      minPrice,
      maxPrice,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getItems,
};
