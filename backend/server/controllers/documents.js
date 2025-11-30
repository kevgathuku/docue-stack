const jwt = require('jsonwebtoken'),
  extractUserFromToken = require('./utils').extractUserFromToken,
  Error = require('./utils').Error,
  Documents = require('../models/documents'),
  Roles = require('../models/roles'),
  Users = require('../models/users');

module.exports = {
  create: async (req, res, next) => {
    try {
      // check header or post parameters for token
      const token = req.headers['x-access-token'] || req.body.token;
      let role;

      if (!req.body.title || req.body.title.trim === '') {
        const err = new Error('The document title is required');
        err.status = 400;
        return next(err);
      }

      // Find if the document already exists
      const document = await Documents.findOne({ title: req.body.title });

      if (document) {
        // If the document already exists send a validation error
        const docErr = new Error('Document already exists');
        docErr.status = 400;
        return next(docErr);
      }

      // Decode the user info from the token
      const decodedUser = jwt.decode(token, { complete: true });
      const user = await Users.findById(decodedUser.payload._id);

      if (!user) {
        const err = new Error('User does not exist');
        err.status = 400;
        return next(err);
      }

      // Get the role from the request body or assign the default role
      if (req.body.role) {
        role = req.body.role.trim();
      } else {
        role = Roles.schema.paths.title.default();
      }

      // Find the corresponding role in the DB
      const fetchedRole = await Roles.findOne({ title: role }).exec();

      if (!fetchedRole) {
        return next(new Error('Role not found'));
      }

      // Create the document
      const newDocument = await Documents.create({
        title: req.body.title,
        content: req.body.content,
        ownerId: decodedUser.payload._id,
        role: fetchedRole,
      });

      res.status(201).json(newDocument);
    } catch (error) {
      next(error);
    }
  },

  docsAuthenticate: async (req, res, next) => {
    try {
      // Extract the user info from the token
      const token = req.body.token || req.headers['x-access-token'];
      const user = extractUserFromToken(token);

      // Validate whether a user can access a specific document
      const doc = await Documents.findById(req.params.id).populate('role').exec();

      if (!doc) {
        return next(new Error('Document not found'));
      }

      // If the user is the doc owner, allow access
      if (user._id == doc.ownerId) {
        return next();
      }

      if (doc.role === undefined) {
        return next(new Error('The document does not specify a role'));
      }

      if (user.role.accessLevel >= doc.role.accessLevel) {
        // If the user's accessLevel is equal or higher to the one
        // specified by the doc, allow access
        return next();
      }

      res.status(403).json({
        error: 'You are not allowed to access this document',
      });
    } catch (err) {
      next(err);
    }
  },

  ownerAuthenticate: async (req, res, next) => {
    try {
      // Extract the user info from the token
      const token = req.body.token || req.headers['x-access-token'];
      const user = extractUserFromToken(token);

      // Validate whether a user can delete a specific document
      const doc = await Documents.findById(req.params.id).populate('role').exec();

      if (!doc) {
        return next(new Error('Document not found'));
      }

      // If the user is the doc owner, allow access
      if (user._id == doc.ownerId) {
        return next();
      }

      if (user.role.accessLevel === 2) {
        // If the user is an admin, allow access
        return next();
      }

      res.status(403).json({
        error: 'You are not allowed to delete this document',
      });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const document = await Documents.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true } // Return the newly updated doc rather than the original
      )
        .populate('ownerId')
        .exec();

      if (!document) {
        return next(new Error('Document not found'));
      }

      res.send(document);
    } catch (err) {
      next(err);
    }
  },

  get: async (req, res, next) => {
    try {
      const document = await Documents.findById(req.params.id)
        .populate('role')
        .populate('ownerId')
        .exec();

      if (!document) {
        return next(new Error('Document not found'));
      }

      res.send(document);
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const doc = await Documents.findOneAndDelete({ _id: req.params.id });

      if (!doc) {
        return next(new Error('Document not found'));
      }

      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  },

  all: async (req, res, next) => {
    try {
      // Extract the user info from the token
      const token = req.body.token || req.headers['x-access-token'];
      const user = extractUserFromToken(token);
      // Set a default limit of 10 if one is not set
      const limit = Number.parseInt(req.query.limit) || 10;

      const docs = await Documents.find({})
        .limit(limit)
        .populate('role')
        .populate('ownerId')
        .sort('-dateCreated')
        .exec();

      // Return docs with accessLevel lower or equal to user's access level
      res.json(
        docs.filter(
          (doc) => doc.role.accessLevel <= user.role.accessLevel || doc.ownerId._id == user._id
        )
      );
    } catch (err) {
      next(err);
    }
  },

  allByRole: async (req, res, next) => {
    try {
      // Extract the user info from the token
      const token = req.body.token || req.headers['x-access-token'];
      const user = extractUserFromToken(token);

      const limit = Number.parseInt(req.query.limit) || 10;
      const role = await Roles.findOne({ title: req.params.role }).exec();

      if (!role) {
        return next(new Error('Role not found'));
      }

      const docs = await Documents.find({ role: role })
        .populate('role')
        .limit(limit)
        .sort('-dateCreated')
        .exec();

      res.json(docs.filter((doc) => doc.role.accessLevel <= user.role.accessLevel));
    } catch (err) {
      next(err);
    }
  },

  allByDate: async (req, res, next) => {
    try {
      // Extract the user info from the token
      const token = req.body.token || req.headers['x-access-token'];
      const user = extractUserFromToken(token);

      const limit = Number.parseInt(req.query.limit) || 10;
      // Ensure the date format is in the format expected
      const dateRegex = /\d{4}-\d{1,2}-\d{1,2}$/;
      // If the regex does not match, throw an error
      if (!dateRegex.test(req.params.date)) {
        const dateError = new Error('Date must be in the format YYYY-MM-DD');
        dateError.status = 400;
        return next(dateError);
      }
      // Get the date provided as a Date object
      const date = new Date(req.params.date);
      // Save the date in a temp variable since the date object is mutable
      const tmp = new Date(req.params.date);
      // Save the next day in a nextDate variable
      // Modifies the tmp variable instead of the date variable
      const nextDate = new Date(tmp.setDate(tmp.getDate() + 1));

      const docs = await Documents.find()
        // Date is greater than the date provided and less than one day ahead
        // i.e. documents created today
        .where('dateCreated')
        .gte(date)
        .lt(nextDate)
        .populate('role')
        .limit(limit)
        .exec();

      res.json(docs.filter((doc) => doc.role.accessLevel <= user.role.accessLevel));
    } catch (err) {
      next(err);
    }
  },
};
