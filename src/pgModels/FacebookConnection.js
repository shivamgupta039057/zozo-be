module.exports = (sequelize, DataTypes) => {
  const FacebookConnection = sequelize.define('FacebookConnection', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    user_id: { type: DataTypes.INTEGER, allowNull: false },

    fb_user_id: { type: DataTypes.TEXT },

    access_token: { type: DataTypes.TEXT, allowNull: false },

    token_expires_at: { type: DataTypes.DATE }
  }, {
    tableName: 'facebook_connections',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['user_id', 'fb_user_id'] }
    ]
  });

  FacebookConnection.associate = models => {
    FacebookConnection.hasMany(models.FacebookPage, {
      foreignKey: 'connection_id'
    });
  };

  return FacebookConnection;
};
