require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const userRouter = require("./router/userRouter");

const db = process.env.DB_URI;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

app.use((err, req, res, next) => {
  if (err) return res.status(500).json({ message: err.message });
});

app.use("/api/v1", userRouter);

mongoose
  .connect(db)
  .then(() => {
    console.log("Mongoose database connected❗");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Database connection error: ${err}`);
  });
