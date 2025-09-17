const {register, getOne} = require("../controllers/userController");
const upload = require("../middleware/multer");

const userRouter = require("express").Router();

userRouter.post("/register",upload.single("profilePicture"), register);
userRouter.get("/get-one/:id", getOne)

module.exports = userRouter
