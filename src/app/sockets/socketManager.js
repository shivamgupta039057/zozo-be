const { getIO } = require("./socketIntance");

function sendAlertToUser(userId, payload) {
 
  const io = getIO();
  if (!io) return;
  console.log(`Sending follow-up alert to user ${userId}:`, payload);

  io.to(`user_${userId}`).emit("followup-alert", payload);
}

module.exports = { sendAlertToUser };
