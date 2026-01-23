const express = require("express");
const router = express.Router();
const controllers = require("../controllers/AbroadController");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");
const { abroadValidation } = require("../../validators/app/homePageVal");
const auth = require("../../middleware/auth");
const upload = require('../../helper/multer');
const { uploadFile } = require("../../helper/fileUploader");
// Get Homepage Data


router.post('/addAbroad', auth, upload.single('image'), uploadFile, validate(abroadValidation), responseHandler(controllers.addAbroadPage));



module.exports = router;
