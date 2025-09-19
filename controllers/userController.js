const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { sendEmail } = require("../middleware/email");

exports.register = async (req, res) => {
  let file;
  try {
    const {
      fullName,
      email,
      password,
      age,
      //   profilePicture,
      phoneNumber,
    } = req.body;
    file = req.file;
    let response = null;
    if (file && file.path) {
      response = await cloudinary.uploader.upload(file.path);
      fs.unlinkSync(file.path);
      // console.log(`Response from cloudinary`, ersponse);
    }
    const existingEmail = await userModel.findOne({ email });
    const existingPhoneNUmber = await userModel.findOne({ phoneNumber });
    if (existingEmail || existingPhoneNUmber) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(400).json({ message: "User already exists" });
    }
    const saltRound = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, saltRound);

    const user = new userModel({
      fullName,
      email,
      password: hashPassword,
      age,
      phoneNumber,
      profilePicture: {
        imageUrl: response?.secure_url,
        publicId: response?.public_id,
      },
    });

    const link = `${req.protocol}://${req.get("host")}/api/v1/verify/${
      user._id
    }`;
    const text = `Last class Account verification`;
    const html = `
      <p>Hello ${fullName},</p>
      <p>Thanks for registering with us. Please click on the link below to verify your account.</p>
      <p><a href="${link}">Verify Account</a></p>
      <p>If you did not register with us, please disregard this email.</p>
      <p>Best regards,</p>
      <p>The Final Class Team</p>
    `;
    await sendEmail({
      email,
      subject: "Registration",
      text,
      html,
    });

    await user.save();
    res
      .status(201)
      .json({ message: "User registered successfully", data: user });
  } catch (error) {
    console.log(error);
    if (file && file.path) fs.unlinkSync(file.path);
    res
      .status(400)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "Not found",
        error: error.message,
      });
    }
    res.status(200).json({
      message: "User below",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  let file = null;
  try {
    const { id } = req.params;
    const { fullName, age } = req.body;
    file = req.file;
    let response = null;

    const userToUpdate = await userModel.findById(id);
    if (!userToUpdate) {
      if (file && file.path) fs.unlinkSync(file.path);

      return res.status(404).json({
        message: "Not found",
        error: error.message,
      });
    }

    const oldprofilePicture = userToUpdate.profilePicture;

    if (file && file.path) {
      response = await cloudinary.uploader.upload(file.path);
      if (oldprofilePicture.publicId)
        await cloudinary.uploader.destroy(oldprofilePicture.publicId);
      fs.unlinkSync(file.path);
    }
    Object.assign(userToUpdate, {
      fullName,
      age,
      profilePicture: {
        imageUrl: response?.secure_url,
        publicId: response?.public_id,
      },
    });
    const user = await userModel.findByIdAndUpdate(
      id,
      {
        fullName: fullName ?? userToUpdate.fullName,
        age: age ?? userToUpdate.age,
        profilePicture: {
          imageUrl: response?.secure_url,
          publicId: response?.public_id,
        },
      },
      { new: true }
    );
    res.status(200).json({
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    if (file && file.path) fs.unlinkSync(file.path);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToUpdate = await userModel.findById(id);

    if (!userToUpdate) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    const profilePicture = userToUpdate.profilePicture;

    await cloudinary.uploader.destroy(profilePicture.publicId);

    await userModel.findByIdAndDelete(id);
    res.status(200).json({
      message: "user deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().populate("profilePicture");

    res.status(200).json({
      total: users.length,
      message:
        users.length > 0 ? "All users gotten successfully" : "No users found",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (user.isVerified) {
      return res.status(400).json({
        message: "Account already verified",
      });
    }
    await userModel.findByIdAndUpdate(
      id,
      {
        isVerified: true,
      },
      { new: true }
    );

    res.status(200).json({
      message: "User verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
