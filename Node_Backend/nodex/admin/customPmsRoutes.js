var express = require('express');
var app = express();
var passport = require('passport');
var custompmsRoutes = express.Router();
require('../../system/nodex/admin/passport')(passport);
var jwt = require('jsonwebtoken');
var config = require('../../config/web-config');
const log = require('../../log/errorLogService');
const bodyParser = require('body-parser');
app.use(bodyParser.json());

custompmsRoutes.route('/getallusers').post(function (req, res) {
  try {
    var Section = require('../../system/nodex/models/users');
    var token = customGetToken(req.headers);
    var decode = jwt.verify(token, config.db.secret);
    var where = {};
    if (req.body.role_id != 1)
      where = { "users_id": decode.users_id.toString(), is_deleted: { $ne: 1 } };
    if (token) {
      Section.find(where, 'name users_id', function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          var temp = [];
          var i = 0;
          result.forEach(function (rowItem) {
            temp[i] = { 'label': rowItem.name, 'value': rowItem.users_id };
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

custompmsRoutes.route('/getallprojects').post(function (req, res) {
  try {
    var Section = require('../models/project');
    var token = customGetToken(req.headers);
    var decode = jwt.verify(token, config.db.secret);
    var where = {};
    if (req.body.role_id != 1)
      where = { is_deleted: { $ne: 1 } };
    if (token) {
      Section.find(where, 'name project_id', function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          var temp = [];
          var i = 0;
          result.forEach(function (rowItem) {
            temp[i] = { 'label': rowItem.name, 'value': rowItem.project_id };
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

custompmsRoutes.route('/getSectionCount').post(function (req, res) {
  try {
    const {sec_id,section,child_coln} =req.body;
    var Section = require('../models/'+section);
    var token = customGetToken(req.headers);
    var decode = jwt.verify(token, config.db.secret);
    var where = {};
    if (req.body.role_id != 1)
      // console.log(typeof(req.body.project_id))
      where = { [child_coln]:sec_id,is_deleted: { $ne: 1 }};
      console.log(where);
    if (token) {
      Section.count(where, function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          res.json(result);
        }
      });
    } else {
      return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
  } catch (err) {
    log.logerror(res, err)
  }
});


custompmsRoutes.route('/getModuleCount').post(function (req, res) {
  try {
    var Section = require('../models/module');
    var token = customGetToken(req.headers);
    var decode = jwt.verify(token, config.db.secret);
    var where = {};
    if (req.body.role_id != 1)
      console.log(typeof(req.body.project_id))
      where = { project:req.body.project_id,is_deleted: { $ne: 1 }};
    if (token) {
      Section.count(where, function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          res.json(result);
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

module.exports = custompmsRoutes;