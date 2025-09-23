require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const userRouter = require("./router/userRouter");
const cors = require("cors");
const productRouter = require("./router/productRouter");
const jwt = require("jsonwebtoken");
const userModel = require("./models/userModel");

const db = process.env.DB_URI;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());

app.use((err, req, res, next) => {
  if (err) return res.status(500).json({ message: err.message });
  next();
});

app.get("/api/v1/", (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const { id } = jwt.verify(token, "permiscus", async (err, decoded) => {
      if (err) return res.status(500).json({ message: err.message });
      const checkUser = await userModel.findById(id);
      res.status(200).json({
        message: `Welcome ${checkUser.name}, we are happy to have you here!`,
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use("/api/v1", userRouter);
app.use("/api/v1", productRouter);

mongoose
  .connect(db)
  .then(() => {
    console.log("Mongoose database connected❗");
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}/api/v1/`);
    });
  })
  .catch((err) => {
    console.log(`Database connection error: ${err}`);
  });
