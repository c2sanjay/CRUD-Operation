const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const productsRouter = require("./routes/products");
const cartRouter = require("./routes/cart");
const uploadsRouter = require("./routes/uploads");
const loanRouter = require("./routes/loan.routes");
const errorMiddleware = require("./middleware/error.middleware");
const { UPLOAD_DIR } = require("./middleware/upload");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: false,
  }),
);

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "1y",
    fallthrough: false,
  }),
);

app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/loans", loanRouter);

app.get("/", (req, res) => {
  res.json({ message: "MERN Shopping Cart API is running" });
});

app.use(errorMiddleware);

module.exports = app;
