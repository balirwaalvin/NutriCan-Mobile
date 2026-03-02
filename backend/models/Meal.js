const mongoose = require('mongoose');

const nutrientInfoSchema = new mongoose.Schema(
  {
    calories: { type: Number, required: true },
    sugar: { type: Number, required: true },
    salt: { type: Number, required: true },
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    nutrients: { type: nutrientInfoSchema, required: true },
  },
  { timestamps: true }
);

// Compound index: fast lookups for a user's meals in date order
mealSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Meal', mealSchema);
