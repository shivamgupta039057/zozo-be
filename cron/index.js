require('dotenv').config();
const { Op } = require("sequelize");
const cron = require("node-cron");
const sequelize = require('../src/config/postgres.config');
const { sendAlertToUser } = require("../src/app/sockets/socketManager");
const { WhatsappChat, WhatsappMessage } = require("../src/pgModels/whatsapp");
const { FollowUp ,Lead} = require("../src/pgModels");
// Ensure DB connection before running cron jobs
// sequelize.authenticate().then(() => {
//   console.log("Database connection established for cron.");
// }).catch((err) => {
//   console.error("Unable to connect to the database in cron:", err);
// });

// Cron job to check and update 24-hour active status of WhatsApp chats
async function chnageActiveStatus() {
  try {
    console.log("⏰ Cron started: Checking 24h active status");

    // 1️⃣ Get chats where is_24h_active = true
    const chats = await WhatsappChat.findAll({
      where: {
        is_24h_active: true,
      },
      attributes: ["id"],
    });

    for (const chat of chats) {
      // 2️⃣ Get last IN message for this chat
      const lastInMessage = await WhatsappMessage.findOne({
        where: {
          chat_id: chat.id,
          // direction: "IN",
        },
        order: [["createdAt", "DESC"]],
      });
      // console.log(`Checking chat ${chat.id}, last IN message at: ${lastInMessage}`);

      if (!lastInMessage) continue;

      // 3️⃣ Check 24 hours difference
      const diffHours =
        (Date.now() - new Date(lastInMessage.createdAt).getTime()) /
        (1000 * 60 * 60);

      if (diffHours >= 24) {
        // 4️⃣ Update chat
        await WhatsappChat.update(
          { is_24h_active: false },
          { where: { id: chat.id } }
        );

        console.log(`❌ Chat ${chat.id} marked inactive`);
      }
    }
  } catch (err) {
    console.error("❌ Error in cron job:", err);
  }
}


cron.schedule("* * * * *", async () => {
  // cron.schedule("*/1 * * * * *", async () => {
  // console.log("⏰ Cron started: Checking due follow-ups");
  const dueFollowUps = await FollowUp.findAll({
    where: {
      followup_time: { [Op.lte]: new Date() },
      status: "pending",
    },
     include: [
    {
      model: Lead,
       as: 'lead',
      attributes: ["id", "name","whatsapp_number", "email"],
    },
  ],
  });

  console.log(`Found ${dueFollowUps.length} due follow-ups`);
  for (const f of dueFollowUps) {

    sendAlertToUser(f.user_id, {
      lead_id: f.lead_id,
        lead_name: f.lead.name,
        lead_whatsapp: f.lead.whatsapp_number,
        lead_email: f.lead.email,
      message: "⏰ Time to call this lead",
    });
  await f.update({ status: "done" });
  }
});


cron.schedule("* * * * *", () => {
  chnageActiveStatus();
});