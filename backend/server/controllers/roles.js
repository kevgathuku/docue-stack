const Role = require('../models/roles');

module.exports = {
  create: async (req, res, next) => {
    try {
      const validRoles = Role.schema.paths.title.enumValues;

      // Explicitly return so that the rest of the code is not executed
      // in case of an error
      if (!req.body.title) {
        return res.status(400).json({
          error: 'The role title is required',
        });
      } else if (validRoles.indexOf(req.body.title) === -1) {
        // Handle an invalid role title
        return res.status(400).json({
          error: req.body.title + ' is not a valid role title',
        });
      }

      const newRole = {
        title: req.body.title,
        accessLevel: null,
      };
      // Assign the access levels
      switch (newRole.title) {
        case 'viewer':
          newRole.accessLevel = 0;
          break;
        case 'staff':
          newRole.accessLevel = 1;
          break;
        case 'admin':
          newRole.accessLevel = 2;
          break;
        default:
      }

      // Try to create the new role and raise an error if it already exists
      const createdRole = await Role.create(newRole);
      res.status(201).json(createdRole);
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error
        const duplicateErr = new Error('Role already exists');
        duplicateErr.status = 400;
        next(duplicateErr);
      } else {
        res.status(500).json(err);
      }
    }
  },

  all: async (req, res) => {
    try {
      const roles = await Role.find().exec();
      res.json(roles);
    } catch (err) {
      res.status(500).json(err);
    }
  },
};
