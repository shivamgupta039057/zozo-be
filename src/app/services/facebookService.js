require('dotenv').config();

const {
  FacebookIntegration
} = require('../../pgModels/index');

const BASE_URL = 'https://graph.facebook.com/v24.0';
const { statusCode } = require("../../config/default.json");
const { getRequest } = require('../../helper/axiosHelper');

module.exports = {
  /**
   * Bulk create field mappings for a Facebook integration
   * @param {number} integrationId
   * @param {Array} mappings
   */
  async saveIntegrationMappings(integrationId, mappings) {
    if (!integrationId || !Array.isArray(mappings)) {
      throw new Error('integrationId and mappings are required');
    }
    // Uncomment and use the following lines if FbFieldMapping model is available:
    // const { FbFieldMapping } = require('../../pgModels/index');
    // if (!FbFieldMapping) {
    //   throw new Error('FbFieldMapping model not found');
    // }
    // return await FbFieldMapping.bulkCreate(
    //   mappings.map(m => ({
    //     integration_id: integrationId,
    //     fb_field_key: m.fb,
    //     crm_field_key: m.crm,
    //     replace_if_empty: m.replace
    //   }))
    // );
    // Currently, no implementation as FbFieldMapping is commented out;
    // You may implement this function as needed.
    throw new Error('Functionality not implemented: FbFieldMapping model required.');
  },

  /* =========================
     FACEBOOK READ APIs
  ========================== */

  async getUserPages(access_token) {
    try {
      if (!access_token) throw new Error('Access token is required');

      const data = await getRequest(
        `${BASE_URL}/me/accounts`,
        { access_token }
      );

      return {
        statusCode: statusCode.OK,
        success: true,
        message: "Facebook user pages fetched successfully",
        data
      };

    } catch (error) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: error.message
      };
    }
  },

  async getLeadgenForms(pageId, access_token) {
    try {
      if (!access_token) throw new Error('Access token is required');
      if (!pageId) throw new Error('Page ID is required');

      const data = await getRequest(
        `${BASE_URL}/${pageId}/leadgen_forms`,
        { access_token }
      );

      return {
        statusCode: statusCode.OK,
        success: true,
        message: "Facebook leadgen forms fetched successfully",
        data
      };

    } catch (error) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: error.message
      };
    }
  },

  async getFormQuestions(formId, access_token) {
    try {
      if (!access_token) throw new Error('Access token is required');
      if (!formId) throw new Error('Form ID is required');

      const data = await getRequest(
        `${BASE_URL}/${formId}`,
        { fields: 'questions', access_token }
      );

      return {
        statusCode: statusCode.OK,
        success: true,
        message: "Facebook form questions fetched successfully",
        data
      };

    } catch (error) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: error.message
      };
    }
  },

  /**
   * Create a Facebook Integration
   * @param {Object} params - { userId, page, form }
   */
  async createIntegration({ userId, page, form }) {
    if (!userId || !page || !page.id || !form || !form.id) {
      throw new Error('userId, page.id, and form.id are required');
    }
    const integration = await FacebookIntegration.create({
      user_id: userId,
      fb_page_id: page.id,
      fb_page_name: page.name,
      fb_form_id: form.id,
      fb_form_name: form.name,
      status: 'active',
    });
    return integration;
  }
};