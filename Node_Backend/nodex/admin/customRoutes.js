var express = require('express');
var app = express();
var passport = require('passport');
var customRoutes = express.Router();
require('../../system/nodex/admin/passport')(passport);
var jwt = require('jsonwebtoken');
var config = require('../../config/web-config');
const log = require('../../log/errorLogService');
const bodyParser = require('body-parser');
app.use(bodyParser.json());

customRoutes.route('/getRoles').post(function (req, res) {
  try {
    var Section = require('../../system/nodex/models/roles');
    var token = customGetToken(req.headers);
    var decode = jwt.verify(token, config.db.secret);
    var where = {};
    if (req.body.role_id != 1)
      where = { "roles_id": { $ne: 1 }, is_deleted: { $ne: 1 }, "created_user_id": decode.users_id.toString() };
    if (token) {
      Section.find(where, 'name roles_id', function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          var temp = [];
          var i = 0;
          result.forEach(function (rowItem) {
            temp[i] = { 'label': rowItem.name, 'value': rowItem.roles_id };
            i++;
          });
          res.json(temp);
        }
      });
    } else {
      return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
  } catch (err) {
    log.logerror(res, err)
  }
});

customRoutes.route('/getTags').post(function (req, res) {
  try {
    var Section = require('../models/tags');
    var token = customGetToken(req.headers);
    var where = {};
    if (token) {
      Section.find(where, 'name tags_id', function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          var temp = [];
          var i = 0;
          result.forEach(function (rowItem) {
            temp[i] = { 'label': rowItem.name, 'value': rowItem.tags_id };
            i++;
          });
          res.json(temp);
        }
      });
    } else {
      return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
  } catch (err) {
    log.logerror(res, err)
  }
});

getToken = (headers) => {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports = customRoutes;