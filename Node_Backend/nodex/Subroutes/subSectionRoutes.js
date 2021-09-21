var express = require('express');
var app = express();
var passport = require('passport');
var subSectonRoute = express.Router();
var http = require("http");
require('../../system/nodex/admin/passport')(passport);
var moment = require('moment');
var jwt = require('jsonwebtoken');
var config = require('../../config/web-config');
const Sections = require('../../system/nodex/models/sections');
const User = require('../../system/nodex/models/users');
const multer = require('multer');
const bodyParser = require('body-parser');
const mailService = require('../../packages/mailService');
const log = require('../../log/errorLogService');
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

subSectonRoute.route('/getlist').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = subSectionGetToken(req.headers);
    if (token) {
      subSectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm)
          return subSectionGetList(req, res);
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

subSectonRoute.route('/subChnagestatus').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = subSectionGetToken(req.headers);
    if (token) {
      subSectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm)
          return subChnagestatus(req, res);
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


subSectonRoute.route('/search').post(passport.authenticate('jwt', { session: false }), function (req, res) {
  try {
    var token = subSectionGetToken(req.headers);
    if (token) {
      subSectionIsPermission(token, data = {}).then((is_perm) => {
        if (is_perm)
          return subSectionSearch(req, res);
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


subSectionGetList = (req, res) => {
  var token = subSectionGetToken(req.headers);
  var decode = jwt.verify(token, config.db.secret);
  var current_section = req.body.section;

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
  if(req.body.filter!==undefined){
    console.log(Object.keys(req.body.filter))
    Object.assign(where,req.body.filter)
  }
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates'){
    var Section = require('../../system/nodex/models/' + current_section);
  }
  else{
    var Section = require('../models/' + current_section);
  }
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
        return subSectionSetPagination(req, res, result);
    });
};

subSectionSetPagination = (req, res, result) => {
 var current_section = req.body.section;
  var where = {};
  var token = subSectionGetToken(req.headers);
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
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
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

subSectionImport = (req, res) => {
  var current_section = req.body.section;
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
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

subSectionExport = (req, res) => {
  var current_section = req.body.section;
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
  var token = subSectionGetToken(req.headers);
  var searchable = [];
  var sort = req.body.sort_order == 'asc' ? 1 : -1;
  var sortBy = req.body.sort_orderBy;
  var sortable = {};
  var relation = [];
  var relation_columns = [];
  var columns = [];
 var current_section = req.body.section;
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

subSectionDeleteRow = (req, res) => {
  var current_section = req.body.section;
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
  Section.findByIdAndUpdate({ _id: req.params.id }, { $set: { is_deleted: 1 } }, function (err, result) {
    if (err)
      return res.status(403).send({ success: false, msg: err });
    else
      return res.json('Successfully removed');
  });
};

subSectionBulkDeleteRows = (req, res) => {
  var current_section = req.body.section;
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
  Section.update({ _id: { $in: req.body.ids } }, { $set: { is_deleted: 1 } }, { multi: true }, function (err) {
    if (err)
      return res.status(403).send({ success: false, msg: err });
    else
      return res.json('Successfully removed');
  });
};

subChnagestatus =(req,res)=>{
  var current_section = req.body.section;
  const data =req.body;
  if (current_section == 'users' || current_section == 'roles' || current_section == 'sections' || current_section == 'menus' || current_section == 'mail-templates')
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
  Section.update({ _id: { $in: data.id } }, { $set: { [data.feild]: data.value } }, { multi: false }, function (err) {
    if (err)
      return res.status(403).send({ success: false, msg: err });
    else
      return res.status(201).send({ success: true, msg: "Updated successfully" });
  });
}

subSectionSearch = (req, res) => {
  let Section;
  const token = subSectionGetToken(req.headers);
  const decode = jwt.verify(token, config.db.secret);
  const searchable = [];
  const sort = req.body.sort_order == 'asc' ? 1 : -1;
  const sortBy = req.body.sort_orderBy;
  const sortable = {};
  const relation = [];
  const relation_columns = [];
  const current_section = req.body.section;
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
  //   if(req.body.filter!==undefined){
  //   Object.assign(where,req.body.filter)
  // }
  // console.log(where)
  async.waterfall([
    subsearchLookupData,
    subcreateColumnConfig
  ]);
  function subsearchLookupData(done) {
    if (JSON.parse(req.body.relation).length > 0) {
      JSON.parse(req.body.relation).map((item, index) => {
        if (item != null && item != 'null') {
          if (item.$lookup.from == 'users' || item.$lookup.from == 'roles' || item.$lookup.from == 'sections' || item.$lookup.from == 'menus')
            Section = require('../../system/nodex/models/' + item.$lookup.from);
          else
            Section = require('../models/' + item.$lookup.from);
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
  function subcreateColumnConfig(done) {
    var current_section = req.body.section;
    if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
      Section = require('../../system/nodex/models/' + current_section);
    else
      Section = require('../models/' + current_section);
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
    console.log(JSON.stringify(column_total_config))
    column_config.push({ "$skip": (req.body.per_page * req.body.current_page) - req.body.per_page });
    column_config.push({ "$limit": req.body.per_page });
    Section.aggregate(column_config).collation({ locale: 'en', strength: 2 }).exec(function (err, result) {
      if (err)
        return res.json({ success: false, msg: err });
      else
        return subSectionSearchPagination(req, res, column_config, column_total_config, result);
    });
  }
};

subSectionSearchPagination = (req, res, column_config, column_total_config, result) => {
  var current_section = req.body.section;
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
  // console.log(">",column_total_config[1]['$match']['$and']);
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

subsectionAdd = (req, res) => {
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
          return subinsertData(req, res, result);
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
    return subinsertData(req, res, result);
  }
};

subinsertData = (req, res, result) => {
  var token = subSectionGetToken(req.headers);
  var decode = jwt.verify(token, config.db.secret);
  var current_section = req.body.section;
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates') {
    var Section = require('../../system/nodex/models/' + current_section);
    if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles')
      result['created_user_id'] = decode.users_id;
  }
  else {
    var Section = require('../models/' + current_section);
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

subSectionFetchDataById = (req, res) => {
  var current_section = req.body.section;
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
  var id = req.params.id;
  Section.findById(id, function (err, result) {
    if (err)
      return res.json({ success: false, msg: err });
    else
      return res.json(result);
  });
};

subgetUserRoleById = (req, res) => {
  var Roles = require('../../system/nodex/models/roles');
  var id = req.params.roles_id;
  Roles.findOne({ 'roles_id': id }, function (err, result) {
    if (err)
      return res.json({ success: false, msg: err });
    else
      return res.json(result);
  });
};

subprofileFetchDataById = (req, res) => {
  var Users = require('../../system/nodex/models/users');
  var id = req.params.users_id;
  Users.findOne({ 'users_id': id }, function (err, result) {
    if (err)
      return res.json({ success: false, msg: err });
    else
      return res.json(result);
  });
}

subSectionUpdate = (req, res) => {
  // var io = req.app.get('socketio');
  // io.to(1).emit('new message', {});
  var current_section = req.body.section;
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
          if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus')
            var Section = require('../../system/nodex/models/' + current_section);
          else
            var Section = require('../models/' + current_section);
          var result = {};
          Object.keys(req.body).forEach(l => {
            if (l != 'file_fields')
              result[l] = req.body[l];
          });
          Section.findById(req.params.id, function (err, rows) {
            var SectionModel = require('../../system/nodex/models/sections');
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
              return subSectionUpdateData(req, res, result);
            });
          });
        }
        i++;
      });
    });
  } else {
    if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
      var Section = require('../../system/nodex/models/' + current_section);
    else
      var Section = require('../models/' + current_section);
    Section.findById(req.params.id, function (err, result) {
      if (!result)
        return next(new Error('Could not load Document'));
      else {
        for (var p in req.body) {
          if (req.body.file_fields.indexOf(p) == -1)
            result[p] = req.body[p];
        }
        return subSectionUpdateData(req, res, result);
      }
    });
  }
};

subSectionChangeStatus = (req, res) => {
  var current_section = req.body.section;
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
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

subSectionUpdateData = (req, res, result) => {
  var current_section = req.body.section;
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
  Section.findOneAndUpdate({ '_id': req.params.id }, result, { new: true }).exec(function (err, updated) {
    if (err)
      return res.json({ success: false, msg: err });
    else
      return res.status(200).json({ msg: 'Updated successfully', data: updated });
  });
};

subSectionDeleteFile = (req, res) => {
  var current_section = req.body.section;
  if (req.originalUrl.split('/')[2] == 'users' || req.originalUrl.split('/')[2] == 'roles' || req.originalUrl.split('/')[2] == 'sections' || req.originalUrl.split('/')[2] == 'menus' || req.originalUrl.split('/')[2] == 'mail-templates')
    var Section = require('../../system/nodex/models/' + current_section);
  else
    var Section = require('../models/' + current_section);
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
subSectionGetToken = (headers) => {
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

subSectionIsPermission = async (token, data) => {
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

module.exports = subSectonRoute;
