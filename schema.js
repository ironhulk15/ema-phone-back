const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dataSchema = new Schema({
  name: String,
  email: String,
  phone: String,
  steps: String,
  last_contacted: String,
}, {
  timestamps: true,
});

const schema = mongoose.model('contacts', dataSchema);

module.exports = schema;