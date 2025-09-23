const {
  register,
  getOne,
  updateUser,
  getAllUsers,
  deleteUser,
  verifyUser,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");
const upload = require("../middleware/multer");

const userRouter = require("express").Router();

userRouter.post("/register", upload.single("profilePicture"), register);
userRouter.get("/user/:id", getOne);
userRouter.delete("/user/:id", deleteUser);
userRouter.put("/user/:id", upload.single("profilePicture"), updateUser);
userRouter.get("/users", getAllUsers);
userRouter.get("/verify/:id", verifyUser);
userRouter.post("/login", login);
userRouter.post("/forgot-password", forgotPassword);
userRouter.get("/reset-password/:userId", resetPassword);

module.exports = userRouter;
