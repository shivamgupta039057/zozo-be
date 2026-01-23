module.exports = (sequelize, DataTypes) => {
  const FbLeadDistributionState = sequelize.define(
    'FbLeadDistributionState',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      integration_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      assigned_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'fb_lead_distribution_state',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ['integration_id', 'user_id'],
        },
      ],
    }
  );

  return FbLeadDistributionState;
};
