const { statusCode, resMessage } = require("../../config/default.json");
const bcrypt = require("bcrypt");
// const Role = require("../../pgModels/roleModel");

const {UserModel,RoleModel,PermissionTemplateModel} = require('../../pgModels/index');
const jwt = require("jsonwebtoken");


exports.addUser = async (body) => {
  try {

    const { name, email, password, phone, roleId, permissionTemplateId, initials, reportingTo, reporteeIds = [] } = body;

    // console.log(body,"sssssssss")

    const existingUser = await UserModel.findOne({ where: { email } });
    if (existingUser) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Email already exists",
      };
    }
    const role = await RoleModel.findByPk(roleId);
    if (!role) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Invalid roleId"
      };

    }


    const permissionTemplate = await PermissionTemplateModel.findByPk(permissionTemplateId);
    if (!permissionTemplate) {
      
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Invalid permissionTemplateId"
      };
    }

    let manager = null;
    if (reportingTo) {
      manager = await UserModel.findByPk(reportingTo, { include: Role });
      if (!manager) {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Invalid reportingTo (manager) id",
        };
      }

      // Optional rule: Caller should report to Manager if reportingTo provided
      if (role.roleName === "Caller" && manager.Role.roleName !== "Manager") {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Caller must report to a Manager if reportingTo is provided",
        };
      }

      // Optional rule: Manager can report to another Manager if reportingTo provided
      if (role.roleName === "Manager" && manager.Role.roleName !== "Manager") {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Manager must report to another Manager if reportingTo is provided",
        };
      }
    }

    // 5️⃣ Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Create User
    const newUser = await UserModel.create({
      name,
      email,
      initials,
      password: hashPassword,
      phone,
      roleId,
      permissionTemplateId,
      reportingTo: manager ? manager.id : null,
    });

    // 7️⃣ Optional Reportees assignment (Manager only, if provided)
    if (role.roleName === "Manager" && Array.isArray(reporteeIds) && reporteeIds.length > 0) {
      await UserModel.update(
        { reportingTo: newUser.id },
        { where: { id: reporteeIds } }
      );
    }
    return {
      statusCode: statusCode.OK,
      success: true,
      message: "User created successfully",
      data: newUser,
    };

    // const hashPassword = await bcrypt.hash(password, 10);

    // const user = await UserModel.create({
    //   name,
    //   email,
    //   initials,
    //   password: hashPassword,
    //   phone,
    //   roleId,
    //   permissionTemplateId
    // });


    // return {
    //   statusCode: statusCode.OK,
    //   success: true,
    //   message: "Add",
    //   data: user,
    // };
  } catch (error) {
    console.log(error, "eeeeeeeee")
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};

exports.getUserList = async (query) => {
  try {
    // Fetch all users with associated role and permission template
    const { roleId } = query
    const whereClause = roleId ? { roleId } : {};
    // const users = await UserModel.findAll({
    //   attributes: ['id', 'name', 'email', 'phone', 'createdAt', 'updatedAt'],
    //   where:whereClause,
    //   include: [
    //     {
    //       model: Role,
    //       attributes: ['id', 'roleName'], // Only include role ID and roleName
    //     },
    //     {
    //       model: PermissionTemplate,
    //       attributes: ['id', 'templateName'], // Only include template ID and templateName
    //     },
    //   ],
    //   order: [['createdAt', 'DESC']], // Optional: newest users first
    // });

    // Return formatted response

    const users = await UserModel.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'createdAt', 'updatedAt'],
      where: whereClause,
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'roleName'],
        },
        {
          model: PermissionTemplateModel,
          as: 'template',
          attributes: ['id', 'templateName'],
        },
        {
          model: UserModel, // Manager of this user
          as: 'manager',   // must match self-association alias in model
          attributes: ['id', 'name', 'email'],
        },
        {
          model: UserModel, // Users reporting to this user (reportees)
          as: 'reportees', // must match self-association alias in model
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });




    return {
      statusCode: statusCode.OK,
      success: true,
      message: "User list fetched successfully",
      data: users,
    };

  } catch (error) {
    console.log(error, "getUserList error");
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.editUser = async (params, body) => {
  try {
    const { id } = params
    const { name, email, password, phone, roleId, permissionTemplateId, initials } = body;

    // ✅ Find the user first
    const user = await UserModel.findByPk(id);
    if (!user) {
      return {
        statusCode: statusCode.NOT_FOUND,
        success: false,
        message: "User not found",
      };
    }

    // ✅ Check if email already exists (and is not the current user's email)
    if (email && email !== user.email) {
      const existingUser = await UserModel.findOne({ where: { email } });
      if (existingUser) {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Email already exists",
        };
      }
    }

    // ✅ Validate roleId if provided
    if (roleId) {
      const role = await RoleModel.findByPk(roleId);
      if (!role) {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Invalid roleId",
        };
      }
    }

    // ✅ Validate permissionTemplateId if provided
    if (permissionTemplateId) {
      const permissionTemplate = await PermissionTemplateModel.findByPk(permissionTemplateId);
      if (!permissionTemplate) {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Invalid permissionTemplateId",
        };
      }
    }

    // ✅ Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.roleId = roleId || user.roleId;
    user.initials = initials || user.initials;
    user.permissionTemplateId = permissionTemplateId || user.permissionTemplateId;

    // ✅ If new password provided, hash it
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // ✅ Save updated user
    await user.save();

    return {
      statusCode: statusCode.OK,
      success: true,
      message: "User updated successfully",
      data: user,
    };

  } catch (error) {
    console.log(error, "editUser error");
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.loginUser = async (body) => {
  try {
    const { email, password } = body;

    // ✅ Check if email & password provided
    if (!email || !password) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Email and password are required",
      };
    }

    // ✅ Find user by email
    const user = await UserModel.findOne({
      where: { email },

        include: [
    { model: RoleModel, as: 'role', attributes: ["id", "roleName"] },
    // { model: PermissionTemplateModel, as: 'template', attributes: ["id", "templateName"] },
  ],
    });
    console.log(user.role.roleName, "userrrrrr")

    if (!user) {
      return {
        statusCode: statusCode.UNAUTHORIZED,
        success: false,
        message: "Invalid email or password",
      };
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return {
        statusCode: statusCode.UNAUTHORIZED,
        success: false,
        message: "Invalid email or password",
      };
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, roleId: user.roleId },
      process.env.SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN } // 1 day expiry
    );

    // ✅ Return success response
    return {
      statusCode: statusCode.OK,
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role ? user.role.roleName : null,
          // permissionTemplate: user.template ? user.template.templateName : null,
        },
      },
    };
  } catch (error) {
    console.log(error, "loginUser error");
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};


exports.getProfileList = async (query, user) => {
  try {
    // Fetch the profile of the currently authenticated user
    const userProfile = await UserModel.findOne({
      attributes: ['id', 'name', 'email', 'initials', 'phone', 'createdAt', 'updatedAt'],
      where: { id: user.id },
      include: [
        {
          model: RoleModel,
          as: 'role',
          attributes: ['id', 'roleName'],
        },
        // {
        //   model: PermissionTemplateModel,
        //   as: 'template',
        //   attributes: ['id', 'templateName'],
        // },
        {
          model: UserModel, // Manager of this user
          as: 'manager',   // must match self-association alias in model
          attributes: ['id', 'name', 'email'],
        },
        {
          model: UserModel, // Users reporting to this user (reportees)
          as: 'reportees', // must match self-association alias in model
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!userProfile) {
      return {
        statusCode: statusCode.NOT_FOUND,
        success: false,
        message: "User profile not found",
      };
    }

    return {
      statusCode: statusCode.OK,
      success: true,
      message: "User profile fetched successfully",
      data: userProfile,
    };
  } catch (error) {
    console.log(error, "getProfileList error");
    return {
      statusCode: statusCode.BAD_REQUEST,
      success: false,
      message: error.message,
    };
  }
};