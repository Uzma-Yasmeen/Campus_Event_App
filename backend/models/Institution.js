const mongoose = require('mongoose');

const InstitutionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Institution', InstitutionSchema);
