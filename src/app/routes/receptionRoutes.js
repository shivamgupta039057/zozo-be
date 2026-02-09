const express = require("express");
const router = express.Router();
const controller = require("../controllers/receptionController.js");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");
const { leadFieldValidation } = require("../../validators/app/leadVal.js");
const upload = require('../../helper/multer');
const { uploadFile } = require("../../helper/fileUploader");
const auth = require("../../middleware/auth");

router.get('/getwhatsappnumber/:number', auth, responseHandler(controller.getnumberController));
router.post('/addReceptionlead', auth,  responseHandler(controller.createReceptionlead));
router.get('/getReceptionLead', auth, responseHandler(controller.getReceptionLeadController));
router.post('/updatefieldlist/:leadId', auth, responseHandler(controller.updateLeadFieldController));
router.post('/deletefieldlist/:id', auth, responseHandler(controller.deleteLeadFieldController));
router.get('/reorderfieldlist', auth, responseHandler(controller.reorderLeadFieldController));
router.post('/checkOutStatus', auth,  responseHandler(controller.createCheckOutLead));



module.exports = router;

