const express = require('express');
const router = express.Router();
const FacebookController = require('../controllers/FacebookController.js');

// 🔹 OAuth callback (FIRST HIT)
router.get('/callback', FacebookController.callback);

// 🔹 Facebook data fetch (FB APIs)
router.get('/pages', FacebookController.getUserPages);
router.get('/leadgen_forms/:pageId', FacebookController.getLeadgenForms);
router.get('/form_questions/:formId', FacebookController.getFormQuestions);

router.post('/integrations',FacebookController.createIntegration);

// 🔹 Integration mappings
router.post('/integrations/:id/mappings', FacebookController.saveIntegrationMappings);

module.exports = router;