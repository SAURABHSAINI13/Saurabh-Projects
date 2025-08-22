import mongoose from 'mongoose';
import { passwordUtils } from '../utils/crypto.js';

// Define valid roles
export const ROLES = {
  FIELD_OFFICER: 'FIELD_OFFICER',
  COMMAND_CENTER: 'COMMAND_CENTER',
  ADMIN: 'ADMIN'
};

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { 
    type: [String], 
    enum: Object.values(ROLES),
    default: [ROLES.FIELD_OFFICER]
  },
  lastLogin: Date,
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Password hashing with Argon2id
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await passwordUtils.hashPassword(this.password);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidate) {
  return await passwordUtils.verifyPassword(this.password, candidate);
};

// Method to check if user has a specific role
userSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};

// Method to check if user has any of the specified roles
userSchema.methods.hasAnyRole = function(roles) {
  return this.roles.some(role => roles.includes(role));
};

export default mongoose.model('User', userSchema);