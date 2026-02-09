module.exports = (sequelize, DataTypes) => {
const FollowUp = sequelize.define("FollowUp", {
  lead_id: DataTypes.INTEGER,
  user_id: DataTypes.INTEGER,
  followup_time: DataTypes.DATE,
  status: {
    type: DataTypes.STRING,
    defaultValue: "pending",
  },
});


  return FollowUp;
};
