
// Bulk assign leads to users by percentage
const express = require("express");
const router = express.Router();
const controller = require("../controllers/leadController");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");

const { leadValidation } = require("../../validators/app/leadVal.js");
const upload = require('../../helper/multer');
const { uploadFile } = require("../../helper/fileUploader");
const auth = require("../../middleware/auth");


router.post('/addLead', auth, validate(leadValidation), responseHandler(controller.createLead));
router.get('/getAllLeads', auth, responseHandler(controller.generateLead));
router.post('/changeleadStatus/:leadId', auth, responseHandler(controller.changeLeadStatus));
router.post('/lead-bulk-upload', auth, upload.single('file'), uploadFile, responseHandler(controller.bulkUploadLeads));
router.get('/stage-status-structure', auth, responseHandler(controller.getStageStatusStructure));

router.post('/bulk-assign', auth, responseHandler(controller.bulkAssignLeads));

module.exports = router;

