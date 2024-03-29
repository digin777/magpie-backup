var express = require('express');
var app = express();
var passport = require('passport');
var sectionAdminRoutes = express.Router();
var http = require("http");
require('./passport')(passport);
var moment = require('moment');
var jwt = require('jsonwebtoken');
var config = require('../../../config/web-config');
const Sections = require('../models/sections');
const User = require('../models/users');
const multer = require('multer');
const bodyParser = require('body-parser');
const mailService = require('../../../packages/mailService');
const log = require('../../../log/errorLogService');
var async = require('async');
app.use(bodyParser.json());
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads/');
  },
  filename: function (req, file, callback) {
    var filename = file.originalname.replace(/[\[\]']/g, '');
    callback(null, filename + '-' + Date.now());
  }
});
const temp_storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './temp/');
  },
  filename: function (req, file, callback) {
    var filename = file.originalname.replace(/[\[\]']/g, '');
    callback(null, filename + '-' + Date.now());
  }
});

// Defined Login route
sectionAdminRoutes.route('/checkLogin').post(function (req, res) {
  try {
    User.findOne({
      email: req.body.email,
      is_deleted: { $ne: 1 },
    }, function (err, user) {
      if (err) throw err;
      if (!user) {
        return res.json({ success: false, msg: 'Incorrect email or password.' });
      } else if (user.status != 'active') {
        return res.json({ success: false, msg: 'Your account is inactive. Please contact Admin for more details.' });
      } else {
        // check if password matches
        user.comparePassword(req.body.password, function (err, isMatch) {
          if (isMatch && !err) {
            User.findOneAndUpdate({ '_id': user._id }, { is_logged_in: 1 }).exec(function (err, updated) {
              if (err)
                return res.json({ success: false, msg: err });
              else {
                var Roles = require('../models/roles');
                Roles.find({ roles_id: user.roles_id }, { name: 1 }).exec(function (err, data) {
                  var data_result = {
                    _id: user._id,
                    users_id: user.users_id,
                    roles_id: user.roles_id,
                    email: user.email,
                    username: user.username,
                    name: user.name,
                    image: user.image,
                    status: user.status,
                    role_name: data[0].name,
                    password: user.password,
                    __v: 0
                  }
                  var token = jwt.sign(data_result, config.db.secret, {
                    expiresIn: '1d' // expires in 1d
                  });
                  // return the information including token as JSON
                  var now_date = new Date(Date.now()).toLocaleString();
                  return res.json({ success: true, token: 'JWT ' + token, result: data_result, todays_date: now_date });
                });
              }
            });
          } else {
            return res.json({ success: false, msg: 'Incorrect email or password.' });
          }
        });
      }
    });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/autologin').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var id = req.body.id;
          User.findById(id, function (err, user) {
            if (err)
              return res.status(403).send({ success: false, msg: 'Unauthorized.' });
            else {
              User.findOneAndUpdate({ '_id': user._id }, { is_logged_in: 1 }).exec(function (err, updated) {
                if (err)
                  return res.json({ success: false, msg: err });
                else {
                  var Roles = require('../models/roles');
                  Roles.find({ roles_id: user.roles_id }, { name: 1 }).exec(function (err, data) {
                    var data_result = {
                      _id: user._id,
                      users_id: user.users_id,
                      roles_id: user.roles_id,
                      email: user.email,
                      username: user.username,
                      name: user.name,
                      image: user.image,
                      status: user.status,
                      role_name: data[0].name,
                      password: user.password,
                      __v: 0
                    }
                    // if user is found and password is right create a token
                    var token = jwt.sign(data_result, config.db.secret, {
                      expiresIn: '1d' // expires in 1d
                    });
                    // return the information including token as JSON
                    var now_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString();
                    return res.json({ success: true, token: 'JWT ' + token, result: data_result, todays_date: now_date });
                  });
                }
              });
            }
          });
        }
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/logout').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      var autologin_users = JSON.parse(req.body.autologin_users);
      var l = 0;
      autologin_users.forEach(function (id) {
        User.findOneAndUpdate({ users_id: id }, { is_logged_in: 0 }).exec(function (err, updated) {
          l++;
          if (autologin_users.length == l) {
            if (err)
              return res.json({ success: false, msg: err });
            else {
              return res.json({ success: true, msg: 'Successfully logout' });
            }
          }
        });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/userDetailsFromToken').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var decode = jwt.verify(token, config.db.secret);
          return res.json({ success: true, result: decode });
        }
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/decodeToken').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var user_token = req.body.token;
          var decode = jwt.verify(user_token.split(' ')[1], config.db.secret);
          var Roles = require('../models/roles');
          Roles.find({ roles_id: decode.roles_id }, { name: 1 }).exec(function (err, data) {
            var data_result = {
              _id: decode._id,
              users_id: decode.users_id,
              roles_id: decode.roles_id,
              username: decode.username,
              email: decode.email,
              name: decode.name,
              image: decode.image,
              role_name: data[0].name,
              __v: 0
            }
            return res.json({ success: true, data: data_result, todays_date: req.body.date, jwt_token: req.body.token, todays_date: req.body.date, msg: 'success' })
          });
        }
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getConfig').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm)
          return sectionGetConfig(req, res);
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getAllMenus').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm)
          return sectionGetAllMenus(req, res);
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getRolePermissionMenus').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm)
          return sectionGetRolePermissionMenus(req, res);
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getDashboardConfig/:role_id').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var Dashboard_config = require('../../../nodex/models/dashboard-config');
          var a = 1;
          var role = new RegExp("\\b" + req.params.role_id + "\\b");
          var where = { $in: [role] };
          Dashboard_config.find({ 'assigned_roles': where, is_deleted: { $ne: 1 } }).sort({ 'entity_order': 1, 'entity_type': 1 }).exec(function (err, result) {
            if (err)
              return res.status(403).send({ success: false, msg: err });
            else {
              if (result.length > 0)
                return res.json(result);
              else {
                Dashboard_config.find({}).sort({ 'entity_order': 1, 'entity_type': 1 }).exec(function (err2, result2) {
                  if (err2)
                    return res.status(403).send({ success: false, msg: err });
                  else
                    return res.json(result2);
                });
              }
            }
          });
        }
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getCurrentRolePermissionMenus/:id').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm)
          return getCurrentRolePermissionMenus(req, res);
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm)
          return sectionGetList(req, res);
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/search').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm)
          return sectionSearch(req, res);
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/export').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm)
          return sectionExport(req, res);
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/import').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var upload = multer({ storage: temp_storage }).any();
          upload(req, res, function (err) {
            if (err)
              return res.json({ success: false, msg: 'Error uploading file..' });
            else
              return sectionImport(req, res);
          });
        }
        else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/add').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var upload = multer({ storage: storage }).any();
          upload(req, res, function (err) {
            if (err)
              return res.json({ success: false, msg: 'Error uploading file..' });
            else
              return sectionAdd(req, res);
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/changePassword').post(passport.authenticate('jwt', {
  session: false
}), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return changePassword(req, res, token)
        } else
          return res.json({
            success: false,
            msg: 'Unauthorized'
          });
      });
    } else
      return res.json({
        success: false,
        msg: 'Unauthorized'
      });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/resetPassword').post(function (req, res) {
  try {
    var moment = require('moment');
    var token = req.body.token;
    var Password = require('../models/reset-password');
    Password.findOne({
      "token": token
    }, {
      "time": 1
    }).exec(function (err, result) {
      if (result) {
        var logTime = moment(result.time);
        var currentTime = moment();
        if (currentTime.isSameOrBefore(logTime.add(15, 'm'))) {
          User.findOne({ users_id: result.users_id }, function (err, user) {
            if (err) return false;
            else {
              updatePassword(user, req.body.new_password).then(response => {
                if (response) {
                  return res.status(200).json({
                    success: true,
                    msg: 'Password changed successfully.'
                  });
                } else {
                  return res.json({
                    success: false,
                    msg: 'You request is timed.'
                  });
                }
              })
            }
          });
        } else {
          return res.json({
            success: false,
            msg: 'Your token has been expired.Please try again.'
          });
        }
      } else {
        return res.json({
          success: false,
          msg: 'Unauthorized'
        });
      }
    });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/checkDuplicateExist/:item/:field/:users_id').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          let Section;
          if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates') {
            Section = require('../models/' + req.originalUrl.split('/')[2]);
          }
          else {
            Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
          }
          let where = {};
          if (req.params.users_id != 0)
            where = { users_id: { $ne: req.params.users_id }, is_deleted: { $ne: 1 }, };
          else
            where = { is_deleted: { $ne: 1 }, };
          where[req.params.field] = req.params.item;
          Section.find(where, function (err, result) {
            if (err)
              return res.status(403).send({ success: false, msg: err });
            else
              return res.json(result);
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/edit_details/:id').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return sectionFetchDataById(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/profile-edit/:users_id').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return profileFetchDataById(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getUserRole/:roles_id').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return getUserRoleById(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/view_details/:id').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return sectionFetchDataById(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getImage/:id').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var Files = require('../models/files');
          var id = req.params.id;
          Files.find({ files_id: id }, function (err, result) {
            if (err)
              return res.status(403).send({ success: false, msg: err });
            else
              return res.json(result);
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/update/:id').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var upload = multer({ storage: storage }).any();
          upload(req, res, function (err) {
            if (err)
              return res.status(403).send({ success: false, msg: 'Error uploading file..' });
            else
              return sectionUpdate(req, res);
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/delete/:id').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return sectionDeleteRow(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/bulk-delete').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return sectionBulkDeleteRows(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/changeStatus/:id').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return sectionChangeStatus(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/deleteFile/:id').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return sectionDeleteFile(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getSettings').get(function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return getSettings(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getUsers').get(function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return getUsers(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getThemeColorSettings').post(function (req, res) {
  try {
    req.body.slug = "admin_theme_color";
    return getRowSettings(req, res);
  }
  catch (err) {
    log.logerror(res, err);
  }
});
sectionAdminRoutes.route('/getWebsiteNameSettings').post(function (req, res) {
  try {
    req.body.slug = "site_name";
    return getRowSettings(req, res);
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getRowSettings').post(function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return getRowSettings(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/updateSettings').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var upload = multer({ storage: storage }).any();
          upload(req, res, function (err) {
            if (err)
              return res.status(403).send({ success: false, msg: 'Error uploading file..' });
            else
              return sectionUpdateSettings(req, res);
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getPackagesInstaller').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          http.get(req.body.package_url + 'package.php?action=get_all', (response) => {
            let result = '';
            response.on('data', (chunk) => {
              result += chunk;
            });
            response.on('end', () => {
              return res.json(JSON.parse(result).data);
            });
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/searchPackagesInstaller').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          http.get(req.body.package_url + 'package.php?action=search&package_name=' + req.body.search_key, (response) => {
            let result = '';
            response.on('data', (chunk) => {
              result += chunk;
            });
            response.on('end', () => {
              return res.json(JSON.parse(result).data);
            });
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getOnePackagesInstaller').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          http.get(req.body.package_url + 'package.php?action=get_one&package_name=' + req.body.package_name, (response) => {
            let result = '';
            response.on('data', (chunk) => {
              result += chunk;
            });
            response.on('end', () => {
              return res.json(JSON.parse(result).data);
            });
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});
sectionAdminRoutes.route('/installedPackages').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var PackageInstaller = require('../models/package-installer');
          PackageInstaller.find({}, function (err, result) {
            if (err) {
              return res.json({ success: false, msg: err });
            }
            else {
              return res.json(result);
            }
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/installPackage').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var npm = require('npm');
          npm.load(function (err) {
            // handle errors
            // install module ffi
            npm.commands.install([req.body.command_line_code], (er, data) => {
              return res.json({ success: true, msg: "successfully installed" });
              // log errors or data
            });
            // npm.on('log', function(message) {
            //   // log installation progress
            //   console.log(message);
            // });
          });
          setTimeout(function () {
            var i = 0;
            var conf = {};
            var data_conf = JSON.parse(req.body['configuration_keys']);
            Object.values(data_conf).forEach(v => {
              conf[String(v)] = "";
              if (parseInt(i) + parseInt(1) == Object.keys(data_conf).length) {
                var PackageInstaller = require('../models/package-installer');
                var package_installer = new PackageInstaller({ "package_name": req.body.package_name, "package_config": JSON.stringify(conf) });
                package_installer.save().then(item => {
                  return res.status(200).json({ success: true, msg: "successfully installed" });
                })
                  .catch(err => {
                    return res.json({ success: false, msg: err });
                  });
              }
              i++;
            });
          }, 10000)
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/updatePackageConfiguration').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    var result = {};
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var PackageInstaller = require('../models/package-installer');
          result = req.body;
          PackageInstaller.findOneAndUpdate({ '_id': req.body._id }, result).exec(function (err, updated) {
            if (err)
              return res.json({ success: false, msg: err });
            else
              return res.status(200).json('Updated successfully');
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getPackageData').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return sectiongetPackageData(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/updatePackageConfiguration').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    var result = {};
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var PackageInstaller = require('../models/package-installer');
          result = req.body;
          PackageInstaller.findOneAndUpdate({ '_id': req.body._id }, result).exec(function (err, updated) {
            if (err)
              return res.json({ success: false, msg: err });
            else
              return res.status(200).json('Updated successfully');
          });
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getMenuNameFromUrl').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return sectiongetMenuNameFromUrl(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

sectionAdminRoutes.route('/getAllModules').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = sectionGetToken(req.headers);
    if (token) {
      sectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          return getAllModules(req, res);
        } else
          return res.json({ success: false, msg: 'Unauthorized' });
      });
    }
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

getAllModules = (req, res) => {
  var Menus = require('../models/' + req.originalUrl.split('/')[2]);
  Menus.find({ 'status': 'active', 'parent_id': { $ne: '0' } }, ['url'], { sort: { menu_order: 1 } }, function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
};

sectiongetMenuNameFromUrl = (req, res) => {
  var Section = require('../models/' + req.originalUrl.split('/')[2]);
  Section.findOne({ 'url': req.body.url, 'status': 'active' }, function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
};

getSettings = (req, res) => {
  var Settings = require('../models/' + req.originalUrl.split('/')[2]);
  var token = getToken(req.headers);
  Settings.find({}, function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
};

getUsers = (req, res) => {
  var Settings = require('../models/' + req.originalUrl.split('/')[2]);
  var token = getToken(req.headers);
  Settings.find({ "roles_id": "1" }, function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
}

getRowSettings = (req, res) => {
  var Settings = require('../models/' + req.originalUrl.split('/')[2]);
  var token = getToken(req.headers);
  Settings.find({ 'slug': req.body.slug }, function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
};

sectionGetAllMenus = (req, res) => {
  var Section = require('../models/' + req.originalUrl.split('/')[2]);
  Section.find({ 'status': 'active' }, null, { sort: { menu_order: 1 } }, function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
};

getCurrentRolePermissionMenus = (req, res) => {
  var Section = require('../models/' + req.originalUrl.split('/')[2]);
  Section.find({ 'roles_id': req.params.id }, function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
}

sectionGetRolePermissionMenus = (req, res) => {
  var where = { 'parent_id': { $ne: 0 }, is_deleted: { $ne: 1 }, };
  if (req.body.role_id != 1)
    where = { 'parent_id': { $ne: 0 }, "menus_id": { $nin: [3, 5] }, is_deleted: { $ne: 1 }, };
  var Section = require('../models/' + req.originalUrl.split('/')[2]);
  Section.find(where, null, { sort: { menu_order: 1 } }, function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
};

sectionGetConfig = (req, res) => {
  Sections.find({ 'section_alias': req.originalUrl.split('/')[2], is_deleted: { $ne: 1 } }, function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
};

sectionGetList = (req, res) => {
  var token = sectionGetToken(req.headers);
  var decode = jwt.verify(token, config.db.secret);
  var current_section = req.originalUrl.split('/')[2];
  var where = {};
  if ((current_section == 'users' || current_section == 'roles') && req.body.role_id != 1) {
    if (current_section == 'users')
      where = { "roles_id": { $ne: 1 }, "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
    if (current_section == 'roles')
      where = { "roles_id": { $ne: 1 }, "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
  } else if (req.body.role_id != 1) {
    where = { "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
  } else {
    where = { is_deleted: { $ne: 1 }, };
  }
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  var orderField = req.body.sort_orderBy;
  var sortBy = req.body.sort_order;
  var order = {};
  order[orderField] = sortBy;
  Section.find(where)
    .collation({ locale: 'en', strength: 2 })
    .limit(req.body.per_page)
    .skip((req.body.per_page * req.body.current_page) - req.body.per_page)
    .sort(order)
    .exec(function (err, result) {
      if (err)
        return res.json({ success: false, msg: err });
      else
        return sectionSetPagination(req, res, result);
    });
};

sectionSetPagination = (req, res, result) => {
  var current_section = req.originalUrl.split('/')[2];
  var where = {};
  var token = sectionGetToken(req.headers);
  var decode = jwt.verify(token, config.db.secret);
  if ((current_section == 'users' || current_section == 'roles') && req.body.role_id != 1) {
    if (current_section == 'users')
      where = { "roles_id": { $ne: 1 }, "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
    if (current_section == 'roles')
      where = { "roles_id": { $ne: 1 }, "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
  } else if (req.body.role_id != 1) {
    where = { "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
  } else {
    where = { is_deleted: { $ne: 1 }, };
  }
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  Section.count(where).exec(function (err, count) {
    if (err) return res.json({ success: false, msg: err });
    else {
      var pg = Math.ceil(count / req.body.per_page);
      var tot = count;
      var to = ((req.body.per_page * req.body.current_page) - req.body.per_page) + Object.keys(result).length;
      var from = (req.body.per_page * req.body.current_page) - req.body.per_page + 1;
      return res.json({ 'data': result, 'current': req.body.current_page, 'pages': pg, 'tot': tot, 'to': to, 'from': from });
    }
  })
};

sectionImport = (req, res) => {
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  const csv = require('fast-csv');
  const csv_data = [];
  csv
    .fromPath("./temp/" + req.files[0].filename)
    .on("data", function (data) {
      csv_data.push(data);
    })
    .on("end", function () {
      const import_columns = csv_data[0];
      const columns = JSON.parse(req.body.columns);
      import_columns.forEach((k) => {
        columns.forEach((v) => {
          // if(k ==v.label && (typeof v['export'] == 'undefined' || (typeof v['export'] != 'undefined' && v.export == 'true')  )  )
          if (k == v.label) {
            const column_index = import_columns.indexOf(k);
            import_columns[column_index] = v.field;
          }
        })
      })
      csv_data[0] = import_columns;
      Object.keys(csv_data).forEach(async (j, k) => {
        var data_csv = {};
        if (j > 0) {
          Object.keys(import_columns).forEach(async (i, v) => {
            data_csv[import_columns[i]] = csv_data[k][v];
          })
          var import_field = req.body.import_unique_field.replace(/['"]+/g, '');
          var section = new Section(data_csv);
          var where_value = {}
          where_value[import_field] = data_csv[import_field]
          var where = where_value;
          Section.findOne(where, function (err, obj) {
            if (obj != null)
              Section.findOneAndUpdate({ '_id': obj._id }, data_csv).exec();
            else
              section.save();
          });
        }
      })
      var fs = require('fs');
      fs.unlink("./temp/" + req.files[0].filename, function (err) {
        if (err)
          return res.status(403).send({ success: false, msg: err });
        else
          return res.json('Successfully imported');
      });
    });
}

sectionExport = (req, res) => {
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  var token = sectionGetToken(req.headers);
  var searchable = [];
  var sort = req.body.sort_order == 'asc' ? 1 : -1;
  var sortBy = req.body.sort_orderBy;
  var sortable = {};
  var relation = [];
  var relation_columns = [];
  var columns = [];
  var current_section = req.originalUrl.split('/')[2];
  var where = {};
  var fields = {};
  fields['_id'] = 0;
  req.body.columns.forEach(col => {
    if ((typeof col['export'] == 'undefined' || (typeof col['export'] != 'undefined' && col.export == 'true'))) {
      columns.push(col.label);
      fields[col.field] = "$" + col.field;
    }
  });
  var decode = jwt.verify(token, config.db.secret);
  if ((current_section == 'users' || current_section == 'roles') && req.body.role_id != 1) {
    if (current_section == 'users')
      where = { "roles_id": { $ne: 1 }, "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
    if (current_section == 'roles')
      where = { "roles_id": { $ne: 1 }, "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
  } else if (req.body.role_id != 1) {
    where = { "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
  } else {
    where = { is_deleted: { $ne: 1 }, };
  }
  /*if(JSON.parse(req.body.relation).length >0){
      JSON.parse(req.body.relation).forEach(function(element) {
         var relation_rules = {};
         relation_rules["$lookup"] = element.$lookup;
         relation.push(relation_rules);
         relation_columns.push(element.$lookup.localField);
         if( JSON.parse(req.body.searchable).indexOf(element.$lookup.localField) !== -1){
           var searchable_rules = {};
           searchable_rules[element.searchForeignField] = { '$regex' : req.body.search, '$options' : 'i' };
           searchable.push(searchable_rules);
         }
         if(element.$lookup.localField == sortBy){
            sortable[element.searchForeignField] =sort;
         }
      });
    }*/
  if (JSON.parse(req.body.searchable).length > 0) {
    JSON.parse(req.body.searchable).forEach(function (element) {
      if (relation_columns.length == 0 || relation_columns.indexOf(element) == -1) {
        var searchable_rules = {};
        searchable_rules[element] = { '$regex': req.body.search, '$options': 'i' };
        searchable.push(searchable_rules);
      }
    });
  }
  if (searchable.length == 0) {
    var searchable_rules = {};
    searchable.push(searchable_rules);
  }
  if (Object.keys(sortable).length == 0) {
    sortable[sortBy] = sort;
  }
  sortable[sortBy] = sort;
  var column_config = [];
  var column_total_config = [];
  if (relation.length > 0) {
    column_config.push(relation[0]);
  }
  column_config.push({ "$sort": sortable });
  if (searchable.length > 0) {
    column_config.push(
      {
        "$match": {
          $and: [
            {
              $or: searchable
            }, where]
        }
      },
      { "$project": fields });
  }
  Section.aggregate(column_config).collation({ locale: 'en', strength: 2 }).exec(function (err, result) {
    if (err)
      return res.json({ success: false, msg: err });
    else
      return res.json({ success: true, data: result, columns: columns, msg: err });
  });
}

sectionDeleteRow = (req, res) => {
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  Section.findByIdAndUpdate({ _id: req.params.id }, { $set: { is_deleted: 1 } }, function (err, result) {
    if (err)
      return res.status(403).send({ success: false, msg: err });
    else
      return res.json('Successfully removed');
  });
};

sectionBulkDeleteRows = (req, res) => {
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  Section.update({ _id: { $in: req.body.ids } }, { $set: { is_deleted: 1 } }, { multi: true }, function (err) {
    if (err)
      return res.status(403).send({ success: false, msg: err });
    else
      return res.json('Successfully removed');
  });
};

sectionSearch = (req, res) => {
  let Section;
  const token = sectionGetToken(req.headers);
  const decode = jwt.verify(token, config.db.secret);
  const searchable = [];
  const sort = req.body.sort_order == 'asc' ? 1 : -1;
  const sortBy = req.body.sort_orderBy;
  const sortable = {};
  const relation = [];
  const relation_columns = [];
  const current_section = req.originalUrl.split('/')[2];
  let where = {};
  if ((current_section == 'users' || current_section == 'roles') && req.body.role_id != 1) {
    if (current_section == 'users')
      where = { "roles_id": { $ne: 1 }, "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
    if (current_section == 'roles')
      where = { "roles_id": { $ne: 1 }, "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
  } else if (req.body.role_id != 1) {
    where = { "created_user_id": decode.users_id, is_deleted: { $ne: 1 }, };
  } else {
    where = { is_deleted: { $ne: 1 }, };
  }
  async.waterfall([
    searchLookupData,
    createColumnConfig
  ]);
  function searchLookupData(done) {
    if (JSON.parse(req.body.relation).length > 0) {
      JSON.parse(req.body.relation).map((item, index) => {
        if (item != null && item != 'null') {
          if (item.$lookup.from == 'users' || item.$lookup.from == 'roles' || item.$lookup.from == 'sections' || item.$lookup.from == 'menus')
            Section = require('../models/' + item.$lookup.from);
          else
            Section = require('../../../nodex/models/' + item.$lookup.from);
          let relation_rules = {};
          let lookup_config = [];
          relation_rules[item.$lookup.displayField] = { '$regex': req.body.search, '$options': 'i' };
          lookup_config.push({
            "$match": {
              $and: [
                {
                  $or: [
                    relation_rules
                  ]
                },
              ]
            }
          })
          relation_columns.push(item.$lookup.localField);
          if (JSON.parse(req.body.searchable).indexOf(item.$lookup.localField) !== -1) {
            let searchable_rules = {};
            Section.aggregate(lookup_config).collation({ locale: 'en', strength: 2 }).exec(function (err, result) {
              if (err) {
                return res.json({ success: false, msg: err });
              }
              else {
                if (result.length > 0) {
                  searchable_rules[item.$lookup.localField] = result[0][item.$lookup.foreignField];
                  searchable.push(searchable_rules);
                }
                if ((JSON.parse(req.body.relation).length) == index + 1) {
                  done(null);
                }
              }
            });
          } else {
            if ((JSON.parse(req.body.relation).length) == index + 1) {
              done(null);
            }
          }
          if (item.$lookup.localField == sortBy) {
            sortable[item.searchForeignField] = sort;
          }
        } else {
          if ((JSON.parse(req.body.relation).length) == index + 1) {
            done(null);
          }
        }
      })
    } else done(null);
  }
  function createColumnConfig(done) {
    if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
      Section = require('../models/' + req.originalUrl.split('/')[2]);
    else
      Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
    if (JSON.parse(req.body.searchable).length > 0) {
      JSON.parse(req.body.searchable).forEach(function (element) {
        if (relation_columns.length == 0 || relation_columns.indexOf(element) == -1) {
          var searchable_rules = {};
          searchable_rules[element] = { '$regex': req.body.search, '$options': 'i' };
          searchable.push(searchable_rules);
        }
      });
    }
    if (searchable.length == 0) {
      var searchable_rules = {};
      searchable.push(searchable_rules);
    }
    if (Object.keys(sortable).length == 0) {
      sortable[sortBy] = sort;
    }
    sortable[sortBy] = sort;
    var column_config = [];
    var column_total_config = [];
    if (relation.length > 0) {
      column_config.push(relation[0]);
      column_total_config.push(relation[0]);
    }
    column_config.push({ "$sort": sortable });
    column_total_config.push({ "$sort": sortable });
    if (searchable.length > 0) {
      column_config.push(
        {
          "$match": {
            $and: [
              {
                $or: searchable
              }, where]
          }
        });
      column_total_config.push(
        {
          "$match": {
            $and: [
              {
                $or: searchable
              }, where]
          }
        });
    }
    column_config.push({ "$skip": (req.body.per_page * req.body.current_page) - req.body.per_page });
    column_config.push({ "$limit": req.body.per_page });
    Section.aggregate(column_config).collation({ locale: 'en', strength: 2 }).exec(function (err, result) {
      if (err)
        return res.json({ success: false, msg: err });
      else
        return sectionSearchPagination(req, res, column_config, column_total_config, result);
    });
  }
};

sectionSearchPagination = (req, res, column_config, column_total_config, result) => {
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  Section.aggregate(column_total_config).collation({ locale: 'en', strength: 2 }).exec(function (err, result_total) {
    if (err)
      return res.status(403).send({ success: false, msg: err });
    else {
      var pg = Math.ceil(Object.keys(result_total).length / req.body.per_page);
      var tot = Object.keys(result_total).length;
      var to = ((req.body.per_page * req.body.current_page) - req.body.per_page) + Object.keys(result).length;
      var from = (req.body.per_page * req.body.current_page) - req.body.per_page + 1;
      return res.json({ 'data': result, 'current': req.body.current_page, 'pages': pg, 'tot': tot, 'to': to, 'from': from });
    }
  })
};

sectionAdd = (req, res) => {
  var total_files = Object.keys(req.files).length;
  var i = 1;
  var file_column_array = [];
  if (Object.keys(req.files).length > 0) {
    Object.keys(req.files).forEach(k => {
      var FilesModel = require('../models/files');
      FilesModel.create({ files_name: req.files[k]['filename'], files_path: req.files[k]['path'], mime_type: req.files[k]['mimetype'], module: req.originalUrl.split('/')[2] }, function (err1, req1, res1) {
        if ((file_column_array[req.files[k]['fieldname']] === undefined)) {
          file_column_array[req.files[k]['fieldname']] = [];
        } if ((file_column_array[req.files[k]['fieldname']] !== undefined)) {
          file_column_array[req.files[k]['fieldname']].push(req1.files_id.toString());
        }
        if (i == total_files) {
          var result = {};
          Object.keys(req.body).forEach(l => {
            if (l != 'file_fields')
              result[l] = req.body[l];
          });
          for (var m of req.body['file_fields'].split(',')) {
            if (file_column_array[m] !== undefined) {
              result[m] = JSON.stringify({ 'selected_values': file_column_array[m] });
            }
            else
              result[m] = "";
          }
          return insertData(req, res, result);
        }
        i++;
      });
    });
  } else {
    var result = {};
    Object.keys(req.body).forEach(l => {
      if (l != 'file_fields')
        result[l] = req.body[l];
    });
    for (var m of req.body['file_fields'].split(',')) {
      result[m] = "";
    }
    return insertData(req, res, result);
  }
};

insertData = (req, res, result) => {
  var token = sectionGetToken(req.headers);
  var decode = jwt.verify(token, config.db.secret);
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates') {
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
    if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles')
      result['created_user_id'] = decode.users_id;
  }
  else {
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
    result['created_user_id'] = decode.users_id;
  }
  var section = new Section(result);
  section.save().then(item => {
    res.status(200).json('added successfully');
  })
    .catch(err => {
      return res.json({ success: false, msg: err });
    });
};

sectionFetchDataById = (req, res) => {
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  var id = req.params.id;
  Section.findById(id, function (err, result) {
    if (err)
      return res.json({ success: false, msg: err });
    else
      return res.json(result);
  });
};

getUserRoleById = (req, res) => {
  var Roles = require('../models/roles');
  var id = req.params.roles_id;
  Roles.findOne({ 'roles_id': id }, function (err, result) {
    if (err)
      return res.json({ success: false, msg: err });
    else
      return res.json(result);
  });
};

profileFetchDataById = (req, res) => {
  var Users = require('../models/users');
  var id = req.params.users_id;
  Users.findOne({ 'users_id': id }, function (err, result) {
    if (err)
      return res.json({ success: false, msg: err });
    else
      return res.json(result);
  });
}

sectionUpdate = (req, res) => {
  // var io = req.app.get('socketio');
  // io.to(1).emit('new message', {});
  var total_files = Object.keys(req.files).length;
  var i = 1;
  var file_column_array = [];
  if (Object.keys(req.files).length > 0) {
    Object.keys(req.files).forEach(k => {
      var FilesModel = require('../models/files');
      FilesModel.create({ files_name: req.files[k]['filename'], files_path: req.files[k]['path'], mime_type: req.files[k]['mimetype'], module: req.originalUrl.split('/')[2] }, function (err1, req1, res1) {
        if ((file_column_array[req.files[k]['fieldname']] === undefined)) {
          file_column_array[req.files[k]['fieldname']] = [];
        } if ((file_column_array[req.files[k]['fieldname']] !== undefined)) {
          file_column_array[req.files[k]['fieldname']].push(req1.files_id.toString());
        }
        if (i == total_files) {
          if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus')
            var Section = require('../models/' + req.originalUrl.split('/')[2]);
          else
            var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
          var result = {};
          Object.keys(req.body).forEach(l => {
            if (l != 'file_fields')
              result[l] = req.body[l];
          });
          Section.findById(req.params.id, function (err, rows) {
            var SectionModel = require('../models/sections');
            SectionModel.find({ 'section_alias': req.originalUrl.split('/')[2] }, function (err, section_rows) {
              for (var m of req.body['file_fields'].split(',')) {
                var item = JSON.parse(section_rows[0].section_config).column;
                var field_config = item.filter(function (item) {
                  return item['field'] == m;
                });
                if (rows[m] != '') {
                  if (file_column_array[m] !== undefined) {
                    var obj = JSON.parse(rows[m]);
                    var column_val = Object.keys(obj).map(function (k) { return obj[k] })[0];
                    var new_column_val = column_val.concat(file_column_array[m]);
                    if (field_config[0].multiple == 'true')
                      result[m] = JSON.stringify({ 'selected_values': new_column_val });
                    else
                      result[m] = JSON.stringify({ 'selected_values': file_column_array[m] });
                  }
                } else {
                  if (file_column_array[m] !== undefined)
                    result[m] = JSON.stringify({ 'selected_values': file_column_array[m] });
                }
              }
              return sectionUpdateData(req, res, result);
            });
          });
        }
        i++;
      });
    });
  } else {
    if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
      var Section = require('../models/' + req.originalUrl.split('/')[2]);
    else
      var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
    Section.findById(req.params.id, function (err, result) {
      if (!result)
        return next(new Error('Could not load Document'));
      else {
        for (var p in req.body) {
          if (req.body.file_fields.indexOf(p) == -1)
            result[p] = req.body[p];
        }
        return sectionUpdateData(req, res, result);
      }
    });
  }
};

sectionChangeStatus = (req, res) => {
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  var column = req.body.field;
  var obj = {};
  obj[column] = req.body.status;
  Section.findOneAndUpdate({ '_id': req.params.id }, obj).exec(function (err, updated) {
    if (err)
      return res.json({ success: false, msg: err });
    else
      return res.status(200).json('Updated successfully');
  });
}

sectionUpdateData = (req, res, result) => {
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  Section.findOneAndUpdate({ '_id': req.params.id }, result, { new: true }).exec(function (err, updated) {
    if (err)
      return res.json({ success: false, msg: err });
    else
      return res.status(200).json({ msg: 'Updated successfully', data: updated });
  });
};

sectionDeleteFile = (req, res) => {
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../models/' + req.originalUrl.split('/')[2]);
  else
    var Section = require('../../../nodex/models/' + req.originalUrl.split('/')[2]);
  Section.findById(req.params.id, function (err, result) {
    if (err)
      return res.status(403).send({ success: false, msg: err });
    else {
      var updated_column = req.body.column;
      var obj = JSON.parse(result[updated_column]);
      var column_val = Object.keys(obj).map(function (k) { return obj[k] })[0];
      const index = column_val.indexOf(req.body.file_id);
      column_val.splice(index, 1);
      var data = {};
      if (column_val.length > 0)
        data[updated_column] = JSON.stringify({ 'selected_values': column_val });
      else
        data[updated_column] = "";
      Section.findOneAndUpdate({ '_id': req.params.id }, { "$set": data }).exec(function (err, updated) {
        if (err)
          return res.status(403).send({ success: false, msg: err });
      });
      return res.status(200).json('Updated successfully');
    }
  });
}

sectiongetPackageData = (req, res) => {
  var Section = require('../models/package-installer');
  Section.findOne({ 'package_name': req.body.package_name }, function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
};

sectionUpdateSettings = (req, res) => {
  var Settings = require('../models/' + req.originalUrl.split('/')[2]);
  var total_files = Object.keys(req.files).length;
  var i = 1;
  var file_column_array = [];
  if (Object.keys(req.files).length > 0) {
    Object.keys(req.files).forEach(k => {
      var FilesModel = require('../models/files');
      FilesModel.create({ files_name: req.files[k]['filename'], files_path: req.files[k]['path'], mime_type: req.files[k]['mimetype'], module: req.originalUrl.split('/')[2] }, function (err1, req1, res1) {
        if ((file_column_array[req.files[k]['fieldname']] === undefined)) {
          file_column_array[req.files[k]['fieldname']] = [];
        } if ((file_column_array[req.files[k]['fieldname']] !== undefined)) {
          file_column_array[req.files[k]['fieldname']].push(req1.files_id.toString());
        }
        if (i == total_files) {
          var result = {};
          Object.keys(req.body).forEach(l => {
            if (l != 'file_fields')
              result[l] = req.body[l];
          });
          for (var m of req.body['file_fields'].split(',')) {
            if (file_column_array[m] !== undefined) {
              result[m] = JSON.stringify({ 'selected_values': file_column_array[m] });
            }
          }
          return sectionUpdateSettingsData(req, res, result);
        }
        i++;
      });
    });
  } else {
    var token = getToken(req.headers);
    var userDetails = jwt.verify(token, config.db.secret);
    user_id = userDetails.users_id;
    Settings.find({ user_id: user_id }, function (err, result) {
      if (!result)
        return next(new Error('Could not load Document'));
      else {
        for (var p in req.body) {
          if (req.body.file_fields.indexOf(p) == -1)
            result[p] = req.body[p];
        }
        return sectionUpdateSettingsData(req, res, result);
      }
    });
  }
}
sectionUpdateSettingsData = (req, res, result) => {
  var Settings = require('../models/' + req.originalUrl.split('/')[2]);
  var token = getToken(req.headers);
  var userDetails = jwt.verify(token, config.db.secret);
  user_id = userDetails.users_id;
  var settingLengthArr = result.length;
  var l = 1;
  console.log(settingLengthArr);
  settingsFlag = 0;
  Object.keys(result).forEach(index => {
    Settings.update({ slug: index }, { $set: { "value": result[index] } }).exec(function (err, updated) {
    });
    if (l == settingLengthArr) {
      settingsFlag = 1;
    }
    l++;
  });
  return res.status(200).json('Updated successfully');
};

sectionAdminRoutes.route('/sendPasswordResetMail').post(function (req, res) {
  try {
    var params = [];
    var Users = require('../models/users');
    var moment = require('moment');
    var Password = require('../models/reset-password');
    Users.findOne({
      "email": req.body.email
    }).exec(function (err, result) {
      if (result) {
        var userId = result['users_id'];
        result['date'] = moment().format();
        var token = jwt.sign(result.toJSON(), config.db.secret);
        var password = new Password({
          "token": token,
          "users_id": userId,
          "time": moment().format()
        });
        password.save().then(item => {
          mailIds = req.body.email;
          params['link'] = req.body.site_url + 'admin/reset-password' + '?token=' + token;
          mailService.sendMailSMTP(mailIds, 'forgot-password', params);
          return res.json({
            success: true,
            msg: 'Follow the link in your mail to reset your password.'
          });
        })
      } else {
        return res.json({
          success: false,
          msg: 'User is not exist.'
        });
      }
    });
  }
  catch (err) {
    log.logerror(res, err);
  }
});

updatePassword = (user, password) => {
  return new Promise(function (resolve, reject) {
    try {
      user.password = password;
      user.save().then(item => {
        resolve(true);
      })
    }
    catch (err) {
      resolve(false);
    }
  });
}

changePassword = (req, res, token) => {
  var result = jwt.verify(token, config.db.secret);
  var Users = require('../models/users');
  Users.findOne({
    users_id: result.users_id
  }, function (err, user) {
    if (err) return false;
    user.comparePassword(req.body.current_password, function (err, isMatch) {
      if (isMatch && !err) {
        updatePassword(user, req.body.new_password).then(response => {
          if (response) {
            return res.status(200).json({
              success: true,
              msg: 'Password changed successfully.'
            });
          } else {
            return res.json({
              success: false,
              msg: 'You request is timed.'
            });
          }
        })
      } else {
        return res.json({
          success: false,
          msg: 'The current password you have entered is wrong.'
        });
      }
    });
  });
}


sectionGetToken = (headers) => {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2)
      return parted[1];
    else
      return null;
  } else {
    return null;
  }
};

sectionIsPermission = async (token, data) => {
  var decode = jwt.verify(token, config.db.secret);
  return await new Promise(function (resolve, reject) {
    User.findById(decode._id, function (err, user) {
      if (user.is_logged_in == 1)
        resolve(true);
      else
        resolve(false);
    });
  });
};

module.exports = sectionAdminRoutes;
