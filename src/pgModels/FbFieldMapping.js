module.exports = (sequelize, DataTypes) => {
  const FbFieldMapping = sequelize.define('FbFieldMapping', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    integration_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'facebook_integrations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    fb_field_key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    crm_field_key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    replace_if_empty: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'fb_field_mappings',
    timestamps: false,
  });

  return FbFieldMapping;
};
