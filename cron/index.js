const cron = require("node-cron");
// Connect to the database so models can be used
const sequelize = require("../src/config/postgres.config");
sequelize.authenticate().then(() => {
  console.log("Database connection established for cron.");
}).catch((err) => {
  console.error("Unable to connect to the database in cron:", err);
});
// const { Op, fn, col, literal } = require("sequelize");
const WhatsappChat = require("../src/pgModels/whatsapp/WhatsappChat");
const WhatsappMessage = require("../src/pgModels/whatsapp/WhatsappMessage");

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
          direction: "IN",
        },
        order: [["createdAt", "DESC"]],
      });

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


// cron.schedule("0 * * * *", () => {
//   chnageActiveStatus();
// });

cron.schedule("* * * * *", () => {
  chnageActiveStatus();
});