const LeadStage = require("./LeadStage");
const LeadStatus = require("./LeadStatus");
const LeadReason = require("./leadReason");
const Lead = require("../lead");

LeadStage.hasMany(LeadStatus, {
  foreignKey: "stage_id",
  as: "statuses",
});
LeadStatus.belongsTo(LeadStage, {
  foreignKey: "stage_id",
  as: "stage",
});

LeadStatus.hasMany(LeadReason , {
  foreignKey: "status_id",
  as: "reasons",
});
LeadReason.belongsTo(LeadStatus, {
  foreignKey: "status_id",
  as: "status",
});

// Lead → Stage, Status, Reason
Lead.belongsTo(LeadStage, { foreignKey: "stage_id", as: "stage" });
Lead.belongsTo(LeadStatus, { foreignKey: "status_id", as: "status" });
Lead.belongsTo(LeadReason, { foreignKey: "reason_id", as: "reason" });

// Optional reverse
LeadStage.hasMany(Lead, { foreignKey: "stage_id", as: "leads" });
LeadStatus.hasMany(Lead, { foreignKey: "status_id", as: "leads" });
LeadReason.hasMany(Lead, { foreignKey: "reason_id", as: "leads" });

module.exports = {
  Lead,
  LeadStage,
  LeadStatus,
  LeadReason 
};