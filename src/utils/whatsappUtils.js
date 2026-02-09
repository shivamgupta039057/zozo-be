const { UserModel } = require("../pgModels/index.js");
const Sequelize = require('sequelize');
const { Op } = require("sequelize");

async function getRandomUserExceptRole1() {
  const user = await UserModel.findOne({
    where: {
      role: {
        [Op.ne]: 1, // ❌ role 1 exclude
      },
    },
    order: Sequelize.literal("RAND()"), // MySQL
    // PostgreSQL ho to 👇
    // order: Sequelize.literal("RANDOM()"),
    attributes: ["id"],
  });

  return user ? user.id : null;
}


module.exports = {
  getRandomUserExceptRole1,
};