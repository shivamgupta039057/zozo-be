const { statusCode, resMessage } = require("../../config/default.json");
const bcrypt = require("bcrypt");
// const Role = require("../../pgModels/roleModel");
const crypto = require("crypto");

const {
  UserModel,
  RoleModel,
  PermissionTemplateModel,
  TemplatePermissionModel,
  MainMenuModel,
} = require("../../pgModels/index");
const jwt = require("jsonwebtoken");
const { emailSend } = require("../helper/helper");

exports.addUser = async (body) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      roleId,
      permissionTemplateId,
      initials,
      reportingTo,
      reporteeIds = [],
    } = body;

    // Check for existing user
    const existingUser = await UserModel.findOne({ where: { email } });
    if (existingUser) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Email already exists",
      };
    }

    // Check if role is valid
    const role = await RoleModel.findByPk(roleId);
    if (!role) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Invalid roleId",
      };
    }

    // Check if permission template is valid
    const permissionTemplate = await PermissionTemplateModel.findByPk(permissionTemplateId);
    if (!permissionTemplate) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Invalid permissionTemplateId",
      };
    }

    let manager = null;
    if (reportingTo) {
      // Manager must exist and have the Role property (eager loading fix, fallback to RoleModel if necessary)
      manager = await UserModel.findByPk(reportingTo, { include: { model: RoleModel, as: "role" } });
      if (!manager) {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Invalid reportingTo (manager) id",
        };
      }
      // Use manager.role or manager.Role depending on ORM config
      const managerRoleName = manager.role ? manager.role.roleName : (manager.Role ? manager.Role.roleName : undefined);
      if (role.roleName === "Caller" && managerRoleName !== "Manager") {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Caller must report to a Manager if reportingTo is provided",
        };
      }
      if (role.roleName === "Manager" && managerRoleName !== "Manager") {
        return {
          statusCode: statusCode.BAD_REQUEST,
          success: false,
          message: "Manager must report to another Manager if reportingTo is provided",
        };
      }
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create new user
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

    // If Manager, assign reportees
    if (
      role.roleName === "Manager" &&
      Array.isArray(reporteeIds) &&
      reporteeIds.length > 0
    ) {
      await UserModel.update(
        { reportingTo: newUser.id },
        { where: { id: reporteeIds } },
      );
    }

    // Prepare email for user creation - send website link, email and password
    // You can create your own template or use plain HTML/text below:

    const websiteLink = "http://zozocrm.com";
    const subject = "Your Account Has Been Created";
    // Note: Sending plain password in email is a security risk, but requested!
    const message = `
      <p>Hello ${name},</p>
      <p>Your account has been created. Please find your login details below:</p>
      <ul>
        <li><strong>Website:</strong> <a href="${websiteLink}" target="_blank">${websiteLink}</a></li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please login and change your password for security reasons.</p>
      <p>Thank you!</p>
    `;

    await emailSend(email, subject, message);

    return {
      statusCode: statusCode.OK,
      success: true,
      message: "User created successfully",
      data: newUser,
    };

  } catch (error) {
    console.log(error, "eeeeeeeee");
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
    const { roleId } = query;
    const whereClause = roleId ? { roleId } : {};
    console.log("whereClausewhereClausewhereClause" , whereClause);
    
    const users = await UserModel.findAll({
      attributes: ["id", "name", "email", "phone", "createdAt", "updatedAt"],
      where: whereClause,
      include: [
        {
          model: RoleModel,
          as: "role",
          attributes: ["id", "roleName"],
        },
        {
          model: PermissionTemplateModel,
          as: "template",
          attributes: ["id", "name"],
        },
        {
          model: UserModel, // Manager of this user
          as: "manager", // must match self-association alias in model
          attributes: ["id", "name", "email"],
        },
        {
          model: UserModel, // Users reporting to this user (reportees)
          as: "reportees", // must match self-association alias in model
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
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
    const { id } = params;
    const {
      name,
      email,
      password,
      phone,
      roleId,
      permissionTemplateId,
      initials,
    } = body;

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
      const permissionTemplate =
        await PermissionTemplateModel.findByPk(permissionTemplateId);
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
    user.permissionTemplateId =
      permissionTemplateId || user.permissionTemplateId;

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
        { model: RoleModel, as: "role", attributes: ["id", "roleName"] },
        // { model: PermissionTemplateModel, as: 'template', attributes: ["id", "templateName"] },
      ],
    });
    console.log(user.role.roleName, "userrrrrr");

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
      { expiresIn: process.env.JWT_EXPIRES_IN }, // 1 day expiry
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

exports.sendotpEmail = async (body) => {
  try {
    const { email } = body;

    // ✅ Check if email & password provided
    if (!email) {
      return {
        statusCode: statusCode.BAD_REQUEST,
        success: false,
        message: "Email is required",
      };
    }

    // ✅ Find user by email
    const user = await UserModel.findOne({
      where: { email },

      include: [
        { model: RoleModel, as: "role", attributes: ["id", "roleName"] },
        // { model: PermissionTemplateModel, as: 'template', attributes: ["id", "templateName"] },
      ],
    });
    console.log(user.role.roleName, "userrrrrr");

    if (!user) {
      return {
        statusCode: statusCode.UNAUTHORIZED,
        success: false,
        message: "Invalid email",
      };
    }

    // ✅ Compare password
    const otp =
      process.env.OTPENV === "LOCAL"
        ? "123456"
        : crypto.randomInt(100000, 999999).toString();
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
      { expiresIn: process.env.JWT_EXPIRES_IN }, // 1 day expiry
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
    // Fetch user profile and permissions in parallel
    const [userProfile, perms] = await Promise.all([
      UserModel.findOne({
        attributes: [
          "id",
          "name",
          "email",
          "initials",
          "phone",
          "createdAt",
          "updatedAt",
        ],
        where: { id: user.id },
        include: [
          {
            model: RoleModel,
            as: "role",
            attributes: ["id", "roleName"],
          },
          {
            model: UserModel, // Manager of this user
            as: "manager",
            attributes: ["id", "name", "email"],
          },
          {
            model: UserModel, // Users reporting to this user (reportees)
            as: "reportees",
            attributes: ["id", "name", "email"],
          },
        ],
      }),
      TemplatePermissionModel.findAll({
        where: { PermissionTemplateId: user.permissionTemplateId },
        include: [{ model: MainMenuModel }],
      }),
    ]);

    if (!userProfile) {
      return {
        statusCode: statusCode.NOT_FOUND,
        success: false,
        message: "User profile not found",
      };
    }

    // Build permissions array with menu details
    const permissions = perms.map((p) => {
      const menu = p.Menu || {};
      return {
        menuId: p.MenuId,
        menuName: menu.name || null,
        menuPath: menu.path || null,
        menuOrder: menu.order || null,
        isHeaderMenu: menu.isHeaderMenu || false,
        create: p.canCreate,
        view: p.canView,
        edit: p.canEdit,
        delete: p.canDelete,
        icon: menu.icon || null,
      };
    });

    // Structure the profile response
    const profileWithPermissions = {
      ...userProfile.toJSON(),
      role: userProfile.role ? userProfile.role.roleName : null,
      manager: userProfile.manager || null,
      reportees: userProfile.reportees || [],
      permissions,
    };

    return {
      statusCode: statusCode.OK,
      success: true,
      message: "User profile fetched successfully",
      data: profileWithPermissions,
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
