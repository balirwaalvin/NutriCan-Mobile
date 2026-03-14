const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String }, // undefined for guest accounts
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    cancerType: { type: String, required: true },
    cancerStage: { type: String, required: true },
    otherConditions: { type: [String], default: [] },
    treatmentStages: { type: [String], default: [] },
    plan: { type: String, enum: ['Free', 'Premium'], default: 'Free' },
    isVerified: { type: Boolean, default: false },
    documentsSubmitted: { type: Boolean, default: false },
    isGuest: { type: Boolean, default: false },
    trialStartedAt: { type: Date },
    bmi: { type: Number },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Auto-calculate BMI if not present or if height/weight are modified
  if (!this.bmi || this.isModified('height') || this.isModified('weight')) {
    if (this.height && this.weight) {
      const heightInMeters = this.height / 100;
      if (heightInMeters > 0) {
        this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
      }
    }
  }

  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare plain password against stored hash
userSchema.methods.comparePassword = function (plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

// Never expose passwordHash in API responses
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
