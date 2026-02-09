// const { LeadField } = require("../pgModels/index");

async function insertDefaultLeadStages(LeadStage) {
  try {
    if (!LeadStage) {
      throw new Error("LeadStage model not loaded");
    }

    const count = await LeadStage.count();

    if (count === 0) {
      console.log("⏳ Inserting default LeadStages...");

      await LeadStage.bulkCreate([
        {
          name: "Initial stage",
          order: 1,
          color: "#f7f7f7",
          is_active: true,
        },
        {
          name: "Active stage",
          order: 2,
          color: "#d9f1d9",
          is_active: true,
        },
        {
          name: "Closed stage",
          order: 3,
          color: "#c9f2c9",
          is_active: true,
        },
      ]);

      console.log("✅ Default LeadStages inserted successfully.");
    } else {
      console.log("ℹ️ LeadStages already exist. Skipping...");
    }
  } catch (error) {
    console.error("❌ Error inserting LeadStages:", error);
  }
}

module.exports = insertDefaultLeadStages;
