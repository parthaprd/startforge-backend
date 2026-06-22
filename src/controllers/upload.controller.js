const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const uploadService = require('../services/upload.service');

const uploadImage = asyncHandler(async (req, res) => {
  const result = await uploadService.uploadImageToImgBB(req.file);
  return ApiResponse.created(res, 'Image uploaded successfully.', result);
});

module.exports = {
  uploadImage,
};
