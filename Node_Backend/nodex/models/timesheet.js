var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);
var Timesheet = new Schema(
	{
		"estimated_hrs":{"type":"String"},
		"project":{"type":"String"},
		"description":{"type":"String"},
		"created_user_id":{"type":"Number","default":0},
		"is_deleted":{"type":"Number","default":0},
		"status":{"type":"String","default":"new"}
	},
	{collection:'timesheet'});
Timesheet.plugin(AutoIncrement,{inc_field: 'timesheet_id'});
module.exports = mongoose.model('Timesheet', Timesheet)