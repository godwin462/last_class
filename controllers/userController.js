// Import necessary modules
const userModel = require("../models/userModel"); // User database model
const bcrypt = require("bcrypt"); // For password hashing
const cloudinary = require("../config/cloudinary"); // Cloudinary configuration for image uploads
const fs = require("fs"); // File system module for file operations
const { sendEmail } = require("../middleware/email"); // Email sending utility
const jwt = require("jsonwebtoken"); // JSON Web Token for authentication
const registerHtml = require("../templates/registerHtml"); // HTML template for registration email
const passwordResetHtml = require("../templates/passwordResetHtml"); // HTML template for password reset email

// Controller for user registration
exports.register = async (req, res) => {
  let file; // Variable to hold the uploaded file
  try {
    // Destructure user data from the request body
    const {
      fullName,
      email,
      password,
      age,
      //   profilePicture,
      phoneNumber,
    } = req.body;
    file = req.file; // Get the uploaded file from the request
    let response = null; // Variable to hold the Cloudinary response
    // Check if a file was uploaded
    if (file && file.path) {
      // Upload the file to Cloudinary
      response = await cloudinary.uploader.upload(file.path);
      // Delete the temporary file from the server
      fs.unlinkSync(file.path);
      // console.log(`Response from cloudinary`, ersponse);
    }
    // Check if a user with the same email or phone number already exists
    const existingEmail = await userModel.findOne({ email });
    const existingPhoneNUmber = await userModel.findOne({ phoneNumber });
    if (existingEmail || existingPhoneNUmber) {
      // If a file was uploaded, delete it
      if (file && file.path) fs.unlinkSync(file.path);
      // Return an error response
      return res.status(400).json({ message: "User already exists" });
    }
    // Generate a salt for password hashing
    const saltRound = await bcrypt.genSalt(10);
    // Hash the password
    const hashPassword = await bcrypt.hash(password, saltRound);

    // Create a new user instance
    const user = new userModel({
      fullName,
      email,
      password: hashPassword,
      age,
      phoneNumber,
      profilePicture: {
        imageUrl: response?.secure_url, // Cloudinary image URL
        publicId: response?.public_id, // Cloudinary public ID
      },
    });

    // Create a verification link
    const link = `${req.protocol}://${req.get("host")}/api/v1/verify/${
      user._id
    }`;
    // Email text body
    const text = `Last class Account verification`;
    // Email HTML body
    const html = registerHtml(link, fullName);
    // Send the verification email
    await sendEmail({
      email,
      subject: "Registration",
      text,
      html,
    });

    // Save the new user to the database
    await user.save();
    // Send a success response
    res
      .status(201)
      .json({ message: "User registered successfully", data: user });
  } catch (error) {
    console.log(error);
    // If a file was uploaded, delete it
    if (file && file.path) fs.unlinkSync(file.path);
    // Send an error response
    res
      .status(400)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Controller to get a single user by ID
exports.getOne = async (req, res) => {
  try {
    // Get the user ID from the request parameters
    const { id } = req.params;
    // Find the user by ID
    const user = await userModel.findById(id);
    // If the user is not found, return an error
    if (!user) {
      return res.status(404).json({
        message: "Not found",
        error: error.message,
      });
    }
    // Send a success response with the user data
    res.status(200).json({
      message: "User below",
      data: user,
    });
  } catch (error) {
    // Send an error response
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Controller to update a user's information
exports.updateUser = async (req, res) => {
  let file = null; // Variable to hold the uploaded file
  try {
    // Get the user ID from the request parameters
    const { id } = req.params;
    // Destructure the new user data from the request body
    const { fullName, age } = req.body;
    file = req.file; // Get the uploaded file from the request
    let response = null; // Variable to hold the Cloudinary response

    // Find the user to be updated
    const userToUpdate = await userModel.findById(id);
    // If the user is not found, return an error
    if (!userToUpdate) {
      if (file && file.path) fs.unlinkSync(file.path);

      return res.status(404).json({
        message: "Not found",
        error: error.message,
      });
    }

    // Get the old profile picture information
    const oldprofilePicture = userToUpdate.profilePicture;

    // If a new file is uploaded, update the profile picture
    if (file && file.path) {
      // Upload the new file to Cloudinary
      response = await cloudinary.uploader.upload(file.path);
      // If there was an old profile picture, delete it from Cloudinary
      if (oldprofilePicture.publicId)
        await cloudinary.uploader.destroy(oldprofilePicture.publicId);
      // Delete the temporary file from the server
      fs.unlinkSync(file.path);
    }
    // Update the user's information
    Object.assign(userToUpdate, {
      fullName,
      age,
      profilePicture: {
        imageUrl: response?.secure_url,
        publicId: response?.public_id,
      },
    });
    // Find and update the user in the database
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
      { new: true } // Return the updated user
    );
    // Send a success response
    res.status(200).json({
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    // If a file was uploaded, delete it
    if (file && file.path) fs.unlinkSync(file.path);
    // Send an error response
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Controller to delete a user
exports.deleteUser = async (req, res) => {
  try {
    // Get the user ID from the request parameters
    const { id } = req.params;
    // Find the user to be deleted
    const userToUpdate = await userModel.findById(id);

    // If the user is not found, return an error
    if (!userToUpdate) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    // Get the profile picture information
    const profilePicture = userToUpdate.profilePicture;

    // Delete the profile picture from Cloudinary
    await cloudinary.uploader.destroy(profilePicture.publicId);

    // Delete the user from the database
    await userModel.findByIdAndDelete(id);
    // Send a success response
    res.status(200).json({
      message: "user deleted successfully",
    });
  } catch (error) {
    console.log(error);
    // Send an error response
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Controller to get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Find all users and populate their profile picture information
    const users = await userModel.find().populate("profilePicture");

    // Send a success response with the list of users
    res.status(200).json({
      total: users.length,
      message:
        users.length > 0 ? "All users gotten successfully" : "No users found",
      data: users,
    });
  } catch (error) {
    // Send an error response
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Controller to verify a user's account
exports.verifyUser = async (req, res) => {
  try {
    // Get the user ID from the request parameters
    const { id } = req.params;
    // Find the user by ID
    const user = await userModel.findById(id);
    // If the user is not found, return an error
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // If the user is already verified, return an error
    if (user.isVerified) {
      return res.status(400).json({
        message: "Account already verified",
      });
    }
    // Update the user's verification status
    user.isVerified = true;
    await user.save();
    // Send a success response
    res.status(200).json({
      message: "User verified successfully",
    });
  } catch (error) {
    // Send an error response
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Controller for user login
exports.login = async (req, res) => {
  try {
    // Destructure email and password from the request body
    const { email, password } = req.body;
    // Find the user by email
    const checkUser = await userModel.findOne({ email: email.toLowerCase() });
    // If the user is not found, return an error
    if (!checkUser) {
      return res.status(400).json({
        message: "Emailnot found",
      });
    }
    // Compare the provided password with the hashed password in the database
    const checkPassword = await bcrypt.compare(password, checkUser.password);
    // If the passwords do not match, return an error
    if (!checkUser || !checkPassword) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Generate a JSON Web Token for the user
    const token = jwt.sign(
      { id: checkUser._id, fullName: checkUser.fullName },
      "permiscus",
      {
        expiresIn: "1m", // Token expires in 1 minute
      }
    );

    // Send a success response with the user data and token
    res.status(200).json({
      message: "Login successful",
      data: checkUser,
      token,
    });
  } catch (error) {
    console.log(error);
    // Send an error response
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Controller to handle forgot password requests
exports.forgotPassword = async (req, res) => {
  try {
    // Get the email from the request body
    const { email } = req.body;
    // Check if a user with the given email exists
    const userExists = await userModel.findOne({ email });
    // If the user is not found, return an error
    if (!userExists) {
      res.status(404).json({ message: "User not found" });
    }
    // Generate a password reset token
    const token = jwt.sign({ id: userExists._id }, "permiscus", {
      expiresIn: "5m", // Token expires in 5 minutes
    });
    // console.log(token);

    // Create a password reset link
    const link = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/reset-password/${userExists._id}`;
    // Email text body
    const text = `Last class Account recovery`;
    // Email HTML body
    const html = passwordResetHtml(link, userExists.fullName);
    // Send the password reset email
    await sendEmail({
      email,
      subject: "Password Reset",
      text,
      html,
    });
    // Save the reset token to the user's record
    userExists.token = token;
    await userExists.save();
    // Send a success response
    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.log(error);
    // Send an error response
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Controller to reset the user's password
exports.resetPassword = async (req, res) => {
  try {
    // Destructure the new password and confirmation from the request body
    const { password, confirmPassword } = req.body;

    // If the passwords do not match, return an error
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }
    // Generate a salt for password hashing
    const salt = await bcrypt.genSalt(10);
    // Hash the new password
    const hash = await bcrypt.hash(password, salt);

    // Get the user ID from the request parameters
    const { userId } = req.params; // Assuming user ID is available in req.params
    // Find the user by ID
    const user = await userModel.findById(userId);

    // Check if users token is null
    if (!user.token) {
      return res.status(404).json({
        message: "Email Expired",
      });
    }

    // Verify the password reset token
    jwt.verify(user.token, "permiscus", async (error, result) => {
      if (error) {
        console.log(error);
        // If the token is invalid or expired, return an error
        return res.status(404).json({
          message: "Email Expired",
        });
      } else {
        // Update the user's password
        user.password = hash;
        user.token = null;
        await user.save();

        // Send a success response
        res.status(200).json({
          message: "Password changed successfully",
        });
      }
    });
  } catch (error) {
    // Send an error response
    res.status(500).json({
      status: "internal server error",
      error: error.message,
    });
  }
};
