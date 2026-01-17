
const { sendTemplate } = require("../app/services/whatsappService");
const { BroadcastLead, Broadcast } = require("../pgModels/index");


const broadcastQueue = require("../helper/redis");

broadcastQueue.process(async job => {

    console.log("JOB RECEIVED:", job.data);
  const { broadcastId, leadId } = job.data;

  const lead = await BroadcastLead.findByPk(leadId);
  const broadcast = await Broadcast.findByPk(broadcastId);


  console.log(lead,"aaaaaaaaaaaaaa")

  console.log(broadcast,"Aaaaaaaaaaaaaa")
  try {
    await sendTemplate({
      to: lead.phone,
      template_name: broadcast.template_name
    });

    await lead.update({ status: "SENT" });

  } catch (err) {

    console.log(err,"eeeeeeeeeeeeeeee")
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

module.exports = broadcastQueue;
