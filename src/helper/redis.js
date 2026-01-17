const Queue = require("bull");

const broadcastQueue = new Queue("broadcast-queue", {
  redis: {
    host: "127.0.0.1",
    port: 6379
  }
});

broadcastQueue.on("ready", () => {
  console.log("✅ Redis Queue Connected");
});

broadcastQueue.on("error", (err) => {
  console.error("❌ Redis Queue Error:", err);
});

module.exports = broadcastQueue;
