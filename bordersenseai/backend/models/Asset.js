// backend/models/Asset.js
import mongoose from 'mongoose';

// Schema for sensor readings
const sensorReadingSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  temperature: Number,
  humidity: Number,
  vibration: Number,
  batteryLevel: Number,
  signalStrength: Number,
  customMetrics: mongoose.Schema.Types.Mixed
});

// Schema for maintenance records
const maintenanceRecordSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['Scheduled', 'Unscheduled', 'Emergency'] },
  description: String,
  technician: String,
  parts: [String],
  cost: Number,
  notes: String
});

// Main Asset schema
const assetSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // Combined type categories from both schemas
  type: { 
    type: String, 
    required: true,
    enum: [
      'vehicle', 'drone', 'camera', 'sensor', 'radio', 'generator', 
      'infrastructure', 'equipment', 'medical', 'other'
    ]
  },

  model: String,
  serialNumber: String,
  manufacturer: String,
  purchaseDate: Date,
  lastMaintenance: Date,
  nextScheduledMaintenance: Date,

  // Combined status enums
  status: { 
    type: String, 
    enum: [
      'Operational', 'Maintenance', 'Repair', 'Offline', 'Retired', 
      'available', 'in-use'
    ],
    default: 'Operational'
  },

  // Location in GeoJSON format for spatial queries
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
    current: {
      lat: Number,
      lon: Number,
      altitude: Number,
      timestamp: Date
    },
    home: {
      lat: Number,
      lon: Number,
      description: String
    }
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deploymentRegion: String,

  // Request-related fields
  quantity: { type: Number },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestType: { type: String, enum: ['supply', 'medical'] },
  description: { type: String },
  isInjured: { type: Boolean, default: false },

  // Operational metrics
  usageHours: { type: Number, default: 0 },
  healthScore: { type: Number, min: 0, max: 1, default: 1 },
  maintenanceRisk: { type: Number, min: 0, max: 1, default: 0 },

  // Sub-schemas
  sensorReadings: [sensorReadingSchema],
  maintenanceHistory: [maintenanceRecordSchema],
  specifications: mongoose.Schema.Types.Mixed,
  notes: String,
  tags: [String],

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes from both schemas
assetSchema.index({ type: 1, status: 1 });
assetSchema.index({ 'location.current.lat': 1, 'location.current.lon': 1 });
assetSchema.index({ deploymentRegion: 1 });
assetSchema.index({ location: '2dsphere' });

// Virtual for asset age
assetSchema.virtual('age').get(function () {
  if (!this.purchaseDate) return null;
  const diffTime = Math.abs(new Date() - this.purchaseDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
});

// Methods
assetSchema.methods.addSensorReading = function (reading) {
  this.sensorReadings.push(reading);
  if (this.sensorReadings.length > 100) {
    this.sensorReadings = this.sensorReadings.slice(-100);
  }
  return this.save();
};

assetSchema.methods.addMaintenanceRecord = function (record) {
  this.maintenanceHistory.push(record);
  this.lastMaintenance = record.date;
  this.status = 'Operational';
  return this.save();
};

assetSchema.methods.updateLocation = function (lat, lon, altitude = null) {
  this.location.current = { lat, lon, altitude, timestamp: new Date() };
  this.location.coordinates = [lon, lat];
  return this.save();
};

export default mongoose.model('Asset', assetSchema);
