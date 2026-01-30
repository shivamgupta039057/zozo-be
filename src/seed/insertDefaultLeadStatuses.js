// const { LeadField } = require("../pgModels/index");

async function insertDefaultLeadStatuses(LeadStatus) {
  try {
    if (!LeadStatus) {
      throw new Error("LeadStatus model not loaded");
    }

    const count = await LeadStatus.count();

    if (count === 0) {
      console.log("⏳ Inserting default LeadStatuses...");

      await LeadStatus.bulkCreate([
        {
          stage_id: 1,
          name: "Just Curious",
          color: "#dfcddc",
          order: 1,
          is_default: true,
          is_active: true,
        },
      ]);

      console.log("✅ Default LeadStatuses inserted successfully.");
    } else {
      console.log("ℹ️ LeadStatuses already exist. Skipping...");
    }
  } catch (error) {
    console.error("❌ Error inserting LeadStatuses:", error);
  }
}

module.exports = insertDefaultLeadStatuses;
