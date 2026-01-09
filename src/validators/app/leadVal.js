const { Joi } = require('express-validation');
const { col } = require('sequelize');

exports.leadValidation = Joi.object({
    data: Joi.object().unknown(true).required(),
    source: Joi.string().trim().required(),
    notes: Joi.string().trim().optional(),
     name: Joi.string().trim().required(),
    whatsapp_number: Joi.string().trim().required(),
  });
  

// Joi validation schema for LeadField model
exports.
leadFieldValidation = Joi.object({
    label: Joi.string().trim().required(),
    type: Joi.string().valid(
        "checkbox",
        "date",
        "dropdown",
        "email",
        "money",
        "number",
        "phone",
        "radio",
        "text",
        "website"
    ).required(),
    options: Joi.array().items(
        Joi.object({
            label: Joi.string().trim().required(),
            value: Joi.string().trim().required(),
            order: Joi.number().integer().optional()
        })
    ).optional(),
    icon: Joi.string().allow(null, "").required(),
    is_required: Joi.boolean().optional(),
    order: Joi.number().integer().optional(),
    is_active: Joi.boolean().optional(),
    default_value: Joi.string().allow("").optional(),
    
});

exports.leadStageValidation = Joi.object({
    name: Joi.string().trim().required(),
    order: Joi.number().integer().required(),
    color: Joi.string().allow(null, "").optional(),
    is_active: Joi.boolean().default(true).optional(),    
});

// Joi validation schema for LeadStatus model
exports.leadStatusValidation = Joi.object({
    stage_id: Joi.number().required(),
    name: Joi.string().trim().required(),
    color: Joi.string().allow(null, "").optional(),
    is_default:Joi.boolean().optional()
});

// Joi validation schema for LeadReason model
exports.leadReasonValidation = Joi.object({
    status_id: Joi.number().required(),
    reason: Joi.string().trim().required(),
});
