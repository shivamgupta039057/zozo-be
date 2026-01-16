const express = require("express");
const router = express.Router();
const controller = require("../controllers/leadStageController.js");
const responseHandler = require("../../helper/responseHandler");
const validate = require("../../helper/validate");

const { leadStageValidation, leadStatusValidation, leadReasonValidation } = require("../../validators/app/leadVal.js");
const upload = require('../../helper/multer');
const { uploadFile } = require("../../helper/fileUploader");
const auth = require("../../middleware/auth");


// lead stage routes


router.get('/getfieldstage', auth, responseHandler(controller.getAllLeadStagesController));
router.get('/getfieldstage/:id', auth, responseHandler(controller.getLeadStageByIdController));
router.post('/addLeadstage', auth, validate(leadStageValidation), responseHandler(controller.createLeadStageController));
router.post('/updatefieldstage/:id', auth, responseHandler(controller.updateLeadStageController));
router.post('/deletefieldstage/:id', auth, responseHandler(controller.deleteLeadStageController));

// lead status routes
router.post('/addLeadstatus', auth, validate(leadStatusValidation), responseHandler(controller.createLeadStatusController));
router.get('/getallstage', auth, responseHandler(controller.getAllLeadStatusesController));
router.post('/updateLeadstatus/:id', auth, responseHandler(controller.updateLeadStatusController));
router.post('/deleteLeadstatus/:id', auth, responseHandler(controller.deleteLeadStatusController));

// lead reason routes
router.post('/addLeadreason', auth, validate(leadReasonValidation), responseHandler(controller.createLeadReasonController));
router.get('/getallreason', auth, responseHandler(controller.getAllLeadReasonsController));
router.post('/updateLeadreason/:id', auth, responseHandler(controller.updateLeadReasonController));
router.post('/deleteLeadreason/:id', auth, responseHandler(controller.deleteLeadReasonController));

// full lead with stage,status,reason
router.get('/getfullLeads', auth, responseHandler(controller.getfullLeadsController));


module.exports = router;

