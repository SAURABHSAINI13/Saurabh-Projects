import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  password: String,
  roles: [String], // e.g., ["PatrolOfficer", "Commander"]
}, { timestamps: true });

// Password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = (candidate) => {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);