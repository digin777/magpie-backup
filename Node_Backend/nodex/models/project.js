var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);
var Project = new Schema(
    {
        "name":{"type":"String"},
        "project_type":{"type":"String"},
        "project_owner":{"type":"String"},
        "start_date":{"type":"String"},
        "end_date":{"type":"String"},
        "budget":{"type":"String"},
        "converted_from":{"type":"String"},
        "created_user_id":{"type":"Number","default":0},
        "is_deleted":{"type":"Number","default":0}
    },
    {collection:'project'}
    );
Project.plugin(AutoIncrement,{inc_field: 'project_id'});
module.exports = mongoose.model('Project', Project)