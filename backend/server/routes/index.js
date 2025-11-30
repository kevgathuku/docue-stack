const express = require('express');
const router = express.Router();
const Documents = require('../models/documents');
const Roles = require('../models/roles');
const UsersController = require('../controllers/users');
const Users = require('../models/users');

router.use('/api', require('./roles'));
router.use('/api', require('./users'));
router.use('/api', require('./documents'));

const stats = (req, res) => {
  // This action is available to admin roles only
  if (req.decoded.role.title !== 'admin') {
    res.status(403).json({
      error: 'Unauthorized Access',
    });
  } else {
    Promise.all([
      Documents.countDocuments().exec(),
      Users.countDocuments().exec(),
      Roles.countDocuments().exec(),
    ])
      .then((counts) => {
        const [docsCount, usersCount, rolesCount] = counts;
        res.json({
          documents: docsCount,
          roles: rolesCount,
          users: usersCount,
        });
      })
      .catch((err) => {
        res.next(err);
      });
  }
};

router.get('/api/stats', UsersController.authenticate, stats);

module.exports = router;
