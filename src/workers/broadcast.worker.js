const broadcastQueue = require("../helper/redis");
require("dotenv").config(); 
const { sendTemplate } = require("../app/services/whatsappService");
const { BroadcastLead, Broadcast,initDB } = require("../pgModels/index");
console.log("🚀 Broadcast Worker Started");

(async () => {
  await initDB(); // 🔥 REQUIRED
  console.log("✅ Worker DB connected");
})();


// broadcastQueue.process(async (job) => {
//   console.log("🔥 Job received:", job.data);

//   // abhi sirf test
//   return true;
// });

broadcastQueue.process(async job => {

  console.log("JOB RECEIVED:", job.data);
  const { broadcast_id, broadcast_lead_id } = job.data;
 const broadcastId = Number(broadcast_id);
const leadId = Number(broadcast_lead_id);


  const lead = await BroadcastLead.findByPk(leadId);
  const broadcast = await Broadcast.findOne({
  where: { id: broadcastId }
});


  try {
    await sendTemplate({
      phone: `91${lead.dataValues.phone}`,
      template_name: broadcast.dataValues.template_name,
      language: "en_US",
    });

    await lead.update({ status: "SENT" });

  } catch (err) {

    console.log(err, "eeeeeeeeeeeeeeee")
    await lead.update({
      status: "FAILED",
      attempts: lead.attempts + 1,
      error_message: err.message
    });

    if (broadcast.auto_retry && lead.attempts < 3) {
      broadcastQueue.add(job.data, { delay: 60000 });
    }
  }
});