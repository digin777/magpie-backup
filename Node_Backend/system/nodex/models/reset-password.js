var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);
var reset_password = new Schema({ "token": { "type": "String" }, "is_deleted": { "type": "Number", "default": 0 }, "users_id": { "type": "String" }, "time": { "type": "String" } }, { collection: 'reset_password' });
reset_password.plugin(AutoIncrement, { inc_field: 'reset_password_id' }); module.exports = mongoose.model('reset_password', reset_password)