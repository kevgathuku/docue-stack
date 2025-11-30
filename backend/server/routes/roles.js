const express = require('express');
const Roles = require('../controllers/roles');
const Users = require('../controllers/users');
const router = express.Router();

router.route('/roles').post(Users.authenticate, Roles.create).get(Users.authenticate, Roles.all);

module.exports = router;
