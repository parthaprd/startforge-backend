/**
 * Upload routes.
 *
 *   POST /image  (protected, multipart/form-data)
 */
const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middlewares/auth.middleware');
const { uploadImage } = require('../middlewares/upload.middleware');

router.post('/image', protect, uploadImage, uploadController.uploadImage);

module.exports = router;
