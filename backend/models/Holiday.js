const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  type: {
    type: String,
    enum: ['custom', 'company_specific'],
    default: 'custom',
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  year: {
    type: Number,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Index for efficient querying by year and date
holidaySchema.index({ year: 1, date: 1 });

// Virtual for getting formatted date
holidaySchema.virtual('formattedDate').get(function() {
  return new Date(this.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

module.exports = mongoose.model('Holiday', holidaySchema);
