module.exports = (sequelize, DataTypes) => {
  const FbLeadDistributionRule = sequelize.define(
    'FbLeadDistributionRule',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      integration_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'facebook_integrations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      percentage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 100,
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'fb_lead_distribution_rules',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return FbLeadDistributionRule;
};
