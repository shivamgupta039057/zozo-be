const FacebookService = require('../services/facebookService.js');

module.exports = {
  /**
   * POST /facebook/integrations/:id/mappings
   * Bulk create field mappings for a Facebook integration
   */


  /**
   * POST /facebook/integrations
   * Create a Facebook Integration
   */
  async createIntegration(req, res) {
    try {
      const { page, form } = req.body;
      const integration = await FacebookService.createIntegration({
        userId: req.user.id,
        page,
        form,
      });
      res.json(integration);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // OAuth callback
  async callback(req, res) {
    try {
      await FacebookService.handleCallback(req);
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations/facebook?connected=true`
      );
    } catch (err) {
      console.error(err);
      res.status(500).send("Facebook callback failed");
    }
  },

  // Facebook APIs (read-only)
  async getUserPages(req, res) {
    const response = await FacebookService.getUserPages(req.query.access_token);
    res.status(response.statusCode).json(response);
  },

  async getLeadgenForms(req, res) {
    const response = await FacebookService.getLeadgenForms(
      req.params.pageId,
      req.query.access_token
    );
    res.status(response.statusCode).json(response);
  },

  async getFormQuestions(req, res) {
    const response = await FacebookService.getFormQuestions(
      req.params.formId,
      req.query.access_token
    );
    res.status(response.statusCode).json(response);
  },



    async saveIntegrationMappings(req, res) {
    try {
      const integrationId = req.params.id;
      const { mappings } = req.body;
      await FacebookService.saveIntegrationMappings(integrationId, mappings);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}