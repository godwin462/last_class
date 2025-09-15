const {register} = require("../controllers/userController");
const upload = require("../middleware/multer");

const userRouter = require("express").Router();

userRouter.post("/register",upload.single("profilePicture"), register);

module.exports = userRouter
