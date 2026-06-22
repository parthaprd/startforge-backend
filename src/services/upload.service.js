const axios = require('axios');
const FormData = require('form-data');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload';

const uploadImageToImgBB = async (file) => {
  if (!file) {
    throw ApiError.badRequest('No image file provided. Use the "image" field.');
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    logger.error('IMGBB_API_KEY is not configured.');
    throw ApiError.internal('Image upload is not configured on the server.');
  }

  const base64 = file.buffer.toString('base64');
  const dataUri = `data:${file.mimetype};base64,${base64}`;

  const form = new FormData();
  form.append('image', dataUri);

  try {
    const response = await axios.post(IMGBB_ENDPOINT, form, {
      params: { key: apiKey },
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000,
    });

    const url =
      response.data &&
      response.data.data &&
      (response.data.data.display_url || response.data.data.url);

    if (!url) {
      throw ApiError.internal('ImgBB did not return an image URL.');
    }

    return {
      url,
      delete_url: response.data.data.delete_url || null,
      width: response.data.data.width || null,
      height: response.data.data.height || null,
    };
  } catch (err) {
    const detail = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
    logger.error(`ImgBB upload failed: ${detail}`);
    throw ApiError.badRequest(`Image upload failed: ${err.message}`);
  }
};

module.exports = {
  uploadImageToImgBB,
};
