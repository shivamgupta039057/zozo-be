const express = require("express");
const router = express.Router();
const controllers = require("../controllers/NeetControllers");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");
const { neetFeatureValidation, neetProductValidation } = require("../../validators/app/homePageVal");
const auth = require("../../middleware/auth");
const upload = require('../../helper/multer');
const { uploadFile } = require("../../helper/fileUploader");
// Get Homepage Data


router.post('/addNeetFeature', auth, upload.single('image'), uploadFile, validate(neetFeatureValidation), responseHandler(controllers.addNeetFeaturePage));
router.post('/addNeetProduct', auth, upload.single('image'), uploadFile, validate(neetProductValidation), responseHandler(controllers.addNeetProductPage));



module.exports = router;
