var express = require('express');
var app = express();
var passport = require('passport');
var usersAdminRoutes = express.Router();
require('../../system/nodex/admin/passport')(passport);
var jwt = require('jsonwebtoken');
var config = require('../../config/web-config');
const log = require('../../log/errorLogService');
const User = require('../../system/nodex/models/users');
const redisPublisher = require('../../packages/redis/publisher');
const bodyParser = require('body-parser');
const multer = require('multer');
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

usersAdminRoutes.route('/getDashboardUsers/:count').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = usersGetToken(req.headers);
    if (token)
      return getDashboardUsers(req, res);
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  } catch (err) {
    log.logerror(res, err);
  }
});

usersAdminRoutes.route('/getUsersCount').get(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = usersGetToken(req.headers);
    if (token)
      return getUsersCount(req, res);
    else
      return res.json({ success: false, msg: 'Unauthorized' });
  } catch (err) {
    log.logerror(res, err);
  }
});

usersAdminRoutes.route('/add').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = usersGetToken(req.headers);
    if (token) {
      usersIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm) {
          var upload = multer({ storage: storage }).any();
          upload(req, res, function (err) {
            if (err)
              return res.json({ success: false, msg: 'Error uploading file..' });
            else
              return usersAdd(req, res);
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

usersAdd = (req, res) => {
  var total_files = Object.keys(req.files).length;
  var i = 1;
  var file_column_array = [];
  if (Object.keys(req.files).length > 0) {
    Object.keys(req.files).forEach(k => {
      var FilesModel = require('../../system/nodex/models/files');
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
    return insertUserData(req, res, result);
  }
};

insertUserData = (req, res, result) => {
  var section = new User(result);
  section.save().then(item => {
    const emailNotificationParams = {
      email: result.email,
      template: 'user_registration',
      params: result
    }
    redisPublisher.publishMessage('emailNotification', JSON.stringify(emailNotificationParams));
    res.status(200).json('added successfully');
  })
    .catch(err => {
      return res.json({ success: false, msg: err });
    });
};

getDashboardUsers = (req, res) => {
  var token = usersGetToken(req.headers);
  var decode = jwt.verify(token, config.db.secret);
  User.aggregate([{ "$match": { created_user_id: decode.users_id, is_deleted: { $ne: 1 }, } }, { "$project": { "Email": "$email", "Name": "$name" } }]).sort({ _id: -1 }).limit(parseInt(req.params.count)).exec(function (err, result) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(result);
    }
  });
};

getUsersCount = (req, res) => {
  var token = usersGetToken(req.headers);
  var decode = jwt.verify(token, config.db.secret);
  User.count({ created_user_id: decode.users_id, is_deleted: { $ne: 1 }, }).exec(function (err, count) {
    if (err) {
      return res.json({ success: false, msg: err });
    }
    else {
      return res.json(count);
    }
  });
};

usersIsPermission = async (token, data) => {
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

usersGetToken = (headers) => {
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

module.exports = usersAdminRoutes;