const mongoose = require('mongoose');

// Task schema.
// - createdAt / updatedAt are generated automatically by { timestamps: true }.
// - enum values reject anything that is not listed (double safety on top of
//   express-validator, which already rejects bad values before this code runs).
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: 'Status must be Pending, In Progress or Completed',
      },
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be Low, Medium or High',
      },
      default: 'Medium',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
