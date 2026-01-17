const { statusCode, resMessage } = require("../../config/default.json");
const Lead = require("../../pgModels/lead");
const broadcastQueue = require("../../helper/redis");
const { Op } = require("sequelize");
const { Broadcast,
    BroadcastFilter,
    BroadcastLead, } = require('../../pgModels/index')
/**
 * Add or update dynamic home page services according to schema.
 *
 * @param {object} body - The home page details to add or update.
 * @returns {object} - An object containing the status code, success flag, message, and home page data.
 * @throws Will throw an error if there is a database error.
 */





function buildWhere(filters) {
    const where = {};

    for (const f of filters) {
        switch (f.operator) {
            case "equals":
                where[f.field] = f.value;
                break;

            case "not_equals":
                where[f.field] = { [Op.ne]: f.value };
                break;

            case "gte":
                where[f.field] = { [Op.gte]: f.value };
                break;

            case "lte":
                where[f.field] = { [Op.lte]: f.value };
                break;

            case "contains":
                where[f.field] = { [Op.iLike]: `%${f.value}%` };
                break;
        }
    }

    return where;
}



exports.createBrodcaste = async (body) => {
   
    try {

        const { name, template_name, filters, auto_retry } = body;

        // 1. Create broadcast master
        const broadcast = await Broadcast.create({
            name,
            template_name,
            auto_retry,
            status: "DRAFT"
        });

        // 2. Save filters (for audit/report)
        await BroadcastFilter.bulkCreate(
            filters.map(f => ({ ...f, broadcast_id: broadcast.id }))
        );

        // 3. Build WHERE condition dynamically
        const where = buildWhere(filters);

        // 4. Fetch leads based on filters
        const leads = await Lead.findAll({
            where,
            attributes: ["id", "whatsapp_number"]
        });

        // 5. Freeze leads snapshot
        await BroadcastLead.bulkCreate(
            leads.map(l => ({
                broadcast_id: broadcast.id,
                lead_id: l.id,
                phone: l.whatsapp_number,
                status: "PENDING"
            }))
        );

        // 6. Update count
        await broadcast.update({ total_leads: leads.length });

        return {
            statusCode: 200,
            success: true,
            message: "Broadcast created successfully",
            data: {
                broadcast_id: broadcast.id,
                total_leads: leads.length
            }
        };

    } catch (error) {
        return {
            statusCode: statusCode.BAD_REQUEST,
            success: false,
            message: error.message,
        };
    }
};



exports.startBroadcast = async (broadcastId) => {
  try {

    // 1. Check broadcast exists
    const broadcast = await Broadcast.findByPk(broadcastId);

 
    if (!broadcast) {
      return {
        statusCode: 404,
        success: false,
        message: "Broadcast not found"
      };
    }

    // 2. Prevent re-start
    if (broadcast.status !== "DRAFT") {
      return {
        statusCode: 400,
        success: false,
        message: "Broadcast already started or completed"
      };
    }

    // 3. Get all pending leads for this broadcast
    const leads = await BroadcastLead.findAll({
      where: {
        broadcast_id: broadcastId,
        status: "PENDING"
      }
    });


    if (!leads.length) {
      return {
        statusCode: 400,
        success: false,
        message: "No leads found for this broadcast"
      };
    }
console.log("Broadcast start called for ID:", broadcastId);
    // 4. Push leads to queue (one-by-one sending)
    for (const lead of leads) {
        console.log("Adding job for lead:", lead.id);
      await broadcastQueue.add({
        broadcast_id: broadcastId,
        broadcast_lead_id: lead.id
      });
    }


    console.log("ccccccccccccccccc")
    // 5. Update broadcast status
    // await broadcast.update({
    //   status: "RUNNING"
    // });

    return {
      statusCode: 200,
      success: true,
      message: "Broadcast started successfully",
      data: {
        broadcast_id: broadcastId,
        total_leads: leads.length
      }
    };

  } catch (error) {
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message
    };
  }
};
