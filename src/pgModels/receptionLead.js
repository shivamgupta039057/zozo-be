module.exports = (sequelize, DataTypes) => {
  const Receptionlead = sequelize.define(
    "Receptionlead",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      checkIn: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      leadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "leads", // name of the table being referenced
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    },
    {
      tableName: "Receptionlead",
      timestamps: true,
    },
  );

  Receptionlead.associate = (models) => {
    Receptionlead.belongsTo(models.Lead, { foreignKey: "leadId", as: "lead" });
    models.Lead.hasMany(Receptionlead, {
      foreignKey: "leadId",
      as: "receptionleads",
    });
  };

  return Receptionlead;
};
