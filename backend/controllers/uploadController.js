const cloudinary = require('../config/cloudinary');

const uploadEvidence = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'maintainiq-evidence' },
          (error, result) => (result ? resolve(result) : reject(error))
        );
        stream.end(req.file.buffer);
      });

    const result = await streamUpload();
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

module.exports = { uploadEvidence };
