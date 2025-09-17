const userMOdel = require("../models/userModel");
const bcrypyt = require("bcrypt");

exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      age,
      //   profilePicture,
      phoneNumber,
    } = req.body;
    const existingEmail = await userMOdel.findOne({ email });
    const existingPhoneNUmber = await userMOdel.findOne({ phoneNumber });
    if (existingEmail || existingPhoneNUmber) {
      return res.status(400).json({ message: "User already exists" });
    }
    const saltRound = await bcrypyt.genSalt(10);
    const hashPassword = await bcrypyt.hash(password, saltRound);

    const user = await userMOdel.create({
      fullName,
      email,
      password: hashPassword,
      age,
      phoneNumber,
    });
    res
      .status(201)
      .json({ message: "User registered successfully", data: user });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
