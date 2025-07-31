const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter (optional, e.g., only allow certain file types)
const fileFilter = (req, file, cb) => {
  // Accept all files for now
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload; 