var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);
var Module = new Schema(
    {
        "module_name": { "type": "String" },
        "module_description": { "type": "String" },
        "owner": { "type": "String" },
        "completion_date": { "type": "String" },
        "project": { "type": "String" },
        "estimated_hours": { "type": "Number" },
        "created_user_id": { "type": "Number", "default": 0 },
        "is_deleted": { "type": "Number", "default": 0 }

    },
    { collection: 'module' });
Module.plugin(AutoIncrement, { inc_field: 'module_id' }); 
module.exports = mongoose.model('Module', Module);