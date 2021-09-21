var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);
var Task = new Schema(
	{
		"task_name":{"type":"String"},
			"task_description":{"type":"String"},
					"task_status":{"type":"String"},
					"assigned_by":{"type":"String"},
					"assigned_to":{"type":"String"},
					"completion_date":{"type":"String"},
					"estimated_hours":{"type":"String"},
					"created_user_id":{"type":"Number","default":0},
					"module":{"type":"String"},
					"is_deleted":{"type":"Number","default":0}
				},
				{collection:'task'});
Task.plugin(AutoIncrement,{inc_field: 'task_id'});module.exports = mongoose.model('Task', Task)