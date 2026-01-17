const express = require("express");
const router = express.Router();
const controllers = require("../controllers/BannerControllers");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");
const { bannerValidation, neetFeatureValidation } = require("../../validators/app/homePageVal");
const auth = require("../../middleware/auth");
const upload = require('../../helper/multer');
const { uploadFile } = require("../../helper/fileUploader");
// Get Homepage Data


router.post('/addBanner', auth, upload.single('image'), uploadFile, validate(bannerValidation), responseHandler(controllers.addBannerPage));



module.exports = router;
