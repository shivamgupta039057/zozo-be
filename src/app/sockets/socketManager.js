const { getIO } = require("./socketIntance");

function sendAlertToUser(userId, payload) {
  const io = getIO();
  if (!io) return;

  io.to(`user_${userId}`).emit("followup-alert", payload);
}

module.exports = { sendAlertToUser };
