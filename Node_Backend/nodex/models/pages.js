var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);
var Pages = new Schema({ "page_name": { "type": "String" }, "is_deleted": { "type": "Number", "default": 0 }, "slug": { "type": "String" }, "url": { "type": "String" }, "content": { "type": "String" }, "status": { "type": "String" }, "users_id": { "type": "Number" } }, { collection: 'pages' });
Pages.plugin(AutoIncrement, { inc_field: 'pages_id' }); module.exports = mongoose.model('Pages', Pages)
