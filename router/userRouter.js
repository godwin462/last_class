const {
  register,
  getOne,
  updateUser,
  getAllUsers,
  deleteUser,
  verifyUser,
} = require("../controllers/userController");
const upload = require("../middleware/multer");

const userRouter = require("express").Router();

userRouter.post("/register", upload.single("profilePicture"), register);
userRouter.get("/user/:id", getOne);
userRouter.delete("/user/:id", deleteUser);
userRouter.put("/user/:id", upload.single("profilePicture"), updateUser);
userRouter.get("/users", getAllUsers);
userRouter.get("/verify/:id", verifyUser);

module.exports = userRouter;
