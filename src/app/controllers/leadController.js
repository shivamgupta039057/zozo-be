
const services = require('../services/leadServices.js');
const { statusCode } = require('../../config/default.json');

exports.createLead = async ({ body, user }) => {
  try {
    // Pass user info to service

    return await services.addLead(body, user);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.generateLead = async ({ user,query,body }) => {
  // console.log("useruseruseruseruser" , user);
 
  // console.log("queryyyyyyyyyyyyyyyyyyyyyyy" , query);
  try {
    return await services.getAllLeads({query,body});
  } catch (error) {
    console.log("errorerror" , error);
    
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.changeLeadStatus = async ({ body , params }) => {
  
  try {
    return await services.changeStatus(body , params);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.bulkUploadLeads = async ({ body, user}) => {
  try {
    return await services.leadUpload( body, user);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.getStageStatusStructure = async ({ query }) => {
  console.log("yyyyyyyyyyyyyyyyyyyyyyyyyyyyy" , query);
  
  try {
    return await services.getStageStatusStructure(query);
  } catch (error) {
    console.log("errorerror" , error);
    
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


// Bulk assign leads to users by percentage
exports.bulkAssignLeads = async ({ body }) => {
  try {
    return await services.bulkAssignLeads(body);
  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};



// Bulk Lead Upload Step 1: Upload File
exports.uploadFile = async ({ body, user }) => {
  try {
    return await services.uploadFile(body, user);
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: error.message || 'Internal server error'
    };
  }
};



exports.getUploadedFiles = async ({ query }) => {
  try {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await services.getUploadedFiles({ limit, offset });
    if (!result.data || result.data.length === 0) {
      return {
        statusCode: 404,
        success: false,
        message: 'No uploaded files found.',
        data: [],
        pagination: result.pagination
      };
    }
    return {
      statusCode: 200,
      success: true,
      ...result
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: error.message || 'Internal server error',
      data: []
    };
  }
};

exports.getleadbyId = async ({ params }) => {
  try {
   return await services.getleadbyId(params.id);

  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: error.message || 'Internal server error'
    };
  }
};


// Step 2: Get Sheets and Headers
exports.getSheets = async ({ params }) => {
  try {
   return await services.getSheets(params.id);

  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: error.message || 'Internal server error'
    };
  }
};

// Step 3: Validate Mapping
exports.validateMapping = async ({ body }) => {
  try {
    const result = await services.validateMapping(body);
    return {
      statusCode: result.statusCode,
      success: result.success,
      message: result.message || (result.success ? 'Mapping validated' : 'Mapping validation failed'),
      duplicates : result.duplicates
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: error.message || 'Internal server error'
    };
  }
};

// Step 4: Check Duplicates
exports.checkDuplicates = async ({ body }) => {
  try {
    const result = await services.checkDuplicates(body);
    return {
      statusCode: result.statusCode,
      success: result.success,
      duplicates: result.duplicates,
      message: result.message || (result.success ? 'Duplicate check complete' : 'Duplicate check failed')
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: error.message || 'Internal server error'
    };
  }
};

// Step 5: Commit Import
exports.commitImport = async ({ body, user }) => {
  try {
    const result = await services.commitImport({ ...body, user });
    return {
      statusCode: result.statusCode,
      success: result.success,
      inserted: result.inserted,
      message: result.message || (result.success ? 'Import committed' : 'Import commit failed')
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: error.message || 'Internal server error'
    };
  }
};