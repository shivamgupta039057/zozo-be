const express = require("express");
const router = express.Router();
const controller = require("../controllers/leadFieldControllers.js");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");
const { leadFieldValidation } = require("../../validators/app/leadVal.js");
const upload = require('../../helper/multer');
const { uploadFile } = require("../../helper/fileUploader");
const auth = require("../../middleware/auth");

router.post('/addLeadfield', auth, validate(leadFieldValidation), responseHandler(controller.createLeadFieldController));
router.get('/getfieldlist', auth, responseHandler(controller.getLeadFieldsController));
router.post('/updatefieldlist/:leadId', auth, responseHandler(controller.updateLeadFieldController));
router.post('/deletefieldlist/:id', auth, responseHandler(controller.deleteLeadFieldController));
router.get('/reorderfieldlist', auth, responseHandler(controller.reorderLeadFieldController));


module.exports = router;

