const express = require("express");
const router = express.Router();
const controller = require("../controllers/mediaController");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");
const { leadValidation } = require("../../validators/app/leadVal.js");
const upload = require('../../helper/multer');
const { uploadFile } = require("../../helper/fileUploader");
const auth = require("../../middleware/auth");

router.post('/upload-media', auth, upload.single('image'), uploadFile, responseHandler(controller.uploadMedia));
router.get('/get-media', auth, responseHandler(controller.getMedia));




module.exports = router;