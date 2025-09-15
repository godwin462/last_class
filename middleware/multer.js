const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const extension = file.mimetype.split("/")[1];
    cb(null, `IMG_${uniqueSuffix}.${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format Images only"));
  }
};

const limits = {
  fileSize: 1024 * 1024 * 5,
};

const upload = multer({ storage, fileFilter, limits });
module.exports = upload;
