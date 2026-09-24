const Item = require("../models/Item");

const seedItems = [
  {
    name: "Wireless Mouse",
    category: "Electronics",
    price: 29.99,
    stock: 42,
    rating: 4.5,
    description: "Ergonomic wireless mouse for productivity.",
  },
  {
    name: "Mechanical Keyboard",
    category: "Electronics",
    price: 89.99,
    stock: 18,
    rating: 4.8,
    description: "Low-noise mechanical keyboard with RGB lighting.",
  },
  {
    name: "Office Chair",
    category: "Furniture",
    price: 149.99,
    stock: 12,
    rating: 4.2,
    description: "Comfortable chair designed for long work hours.",
  },
  {
    name: "Yoga Mat",
    category: "Fitness",
    price: 39.5,
    stock: 31,
    rating: 4.6,
    description: "Non-slip exercise mat for workouts and stretching.",
  },
  {
    name: "Coffee Grinder",
    category: "Kitchen",
    price: 54.0,
    stock: 9,
    rating: 4.4,
    description: "Compact grinder for fresh coffee beans.",
  },
  {
    name: "Water Bottle",
    category: "Lifestyle",
    price: 19.99,
    stock: 50,
    rating: 4.3,
    description: "Insulated stainless steel bottle to keep drinks cold.",
  },
  {
    name: "Desk Lamp",
    category: "Office",
    price: 34.5,
    stock: 22,
    rating: 4.1,
    description: "Minimal LED desk lamp with adjustable brightness.",
  },
  {
    name: "Backpack",
    category: "Lifestyle",
    price: 58.0,
    stock: 15,
    rating: 4.7,
    description: "Lightweight travel backpack with multiple pockets.",
  },
];

async function ensureSeedData() {
  const total = await Item.countDocuments();
  if (total === 0) {
    await Item.insertMany(seedItems);
  }
}

async function getItems({
  page = 1,
  limit = 6,
  sortBy = "createdAt",
  sortOrder = "desc",
  search = "",
  category = "",
  minPrice = "",
  maxPrice = "",
}) {
  await ensureSeedData();

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 50);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (minPrice !== "" || maxPrice !== "") {
    query.price = {};
    if (minPrice !== "") query.price.$gte = Number(minPrice);
    if (maxPrice !== "") query.price.$lte = Number(maxPrice);
  }

  const totalItems = await Item.countDocuments(query);
  const totalPages = Math.max(Math.ceil(totalItems / safeLimit), 1);

  const items = await Item.find(query)
    .sort({ [sortBy]: sortDirection })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit)
    .lean();

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
    },
  };
}

module.exports = {
  getItems,
};
