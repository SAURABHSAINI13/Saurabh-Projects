// backend/services/maintenancePredictor.js

/**
 * AI-powered predictive maintenance service that analyzes equipment data
 * to predict maintenance needs and prevent equipment failures.
 */

/**
 * Predict maintenance needs for a specific asset
 * @param {Object} asset - Asset data including usage history and sensor readings
 * @param {Object} options - Optional configuration
 * @returns {Object} - Maintenance prediction results
 */
export const predictMaintenance = (asset, options = {}) => {
  try {
    // In a real implementation, this would use a trained ML model
    // For now, we'll simulate predictions based on usage patterns
    
    const { type, lastMaintenance, usageHours, sensorData } = asset;
    
    // Calculate base risk based on time since last maintenance
    const daysSinceLastMaintenance = calculateDaysSince(lastMaintenance);
    let maintenanceRisk = calculateBaseRisk(type, daysSinceLastMaintenance);
    
    // Adjust risk based on usage hours
    maintenanceRisk = adjustRiskForUsage(maintenanceRisk, type, usageHours);
    
    // Analyze sensor data for anomalies (if available)
    if (sensorData && sensorData.length > 0) {
      maintenanceRisk = adjustRiskForSensorData(maintenanceRisk, sensorData);
    }
    
    // Calculate days until maintenance is recommended
    const daysUntilMaintenance = calculateDaysUntilMaintenance(maintenanceRisk);
    
    // Generate maintenance recommendations
    const recommendations = generateRecommendations(type, maintenanceRisk, daysUntilMaintenance);
    
    return {
      assetId: asset.id,
      assetType: type,
      maintenanceRisk, // 0-1 scale
      daysUntilMaintenance,
      recommendations,
      predictionConfidence: 0.8, // In a real system, this would be model confidence
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error predicting maintenance:', error);
    throw error;
  }
};

/**
 * Predict maintenance needs for multiple assets
 * @param {Array} assets - Array of asset data
 * @param {Object} options - Optional configuration
 * @returns {Array} - Array of maintenance prediction results
 */
export const batchPredictMaintenance = (assets, options = {}) => {
  return assets.map(asset => predictMaintenance(asset, options));
};

/**
 * Calculate days since a given date
 * @param {Date} date - Date to calculate from
 * @returns {number} - Number of days
 */
const calculateDaysSince = (date) => {
  const now = new Date();
  const diffTime = Math.abs(now - new Date(date));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculate base risk based on asset type and days since last maintenance
 * @param {string} assetType - Type of asset
 * @param {number} days - Days since last maintenance
 * @returns {number} - Base risk score (0-1)
 */
const calculateBaseRisk = (assetType, days) => {
  // Different asset types have different maintenance schedules
  const maintenanceIntervals = {
    'vehicle': 90, // 3 months
    'drone': 30, // 1 month
    'camera': 180, // 6 months
    'sensor': 365, // 1 year
    'radio': 120, // 4 months
    'generator': 60 // 2 months
  };
  
  const interval = maintenanceIntervals[assetType] || 90;
  
  // Calculate risk as a ratio of days since maintenance to recommended interval
  let risk = days / interval;
  
  // Cap risk at 1.0
  return Math.min(risk, 1.0);
};

/**
 * Adjust risk based on usage hours
 * @param {number} baseRisk - Base risk score
 * @param {string} assetType - Type of asset
 * @param {number} usageHours - Hours of usage since last maintenance
 * @returns {number} - Adjusted risk score
 */
const adjustRiskForUsage = (baseRisk, assetType, usageHours) => {
  // Different asset types have different usage thresholds
  const usageThresholds = {
    'vehicle': 500,
    'drone': 100,
    'camera': 2000,
    'sensor': 5000,
    'radio': 1000,
    'generator': 300
  };
  
  const threshold = usageThresholds[assetType] || 1000;
  
  // Calculate usage factor
  const usageFactor = Math.min(usageHours / threshold, 1.0);
  
  // Blend base risk with usage factor (60% base, 40% usage)
  return (baseRisk * 0.6) + (usageFactor * 0.4);
};

/**
 * Adjust risk based on sensor data
 * @param {number} baseRisk - Base risk score
 * @param {Array} sensorData - Array of sensor readings
 * @returns {number} - Adjusted risk score
 */
const adjustRiskForSensorData = (baseRisk, sensorData) => {
  // In a real implementation, this would use anomaly detection algorithms
  // For now, we'll use a simple threshold-based approach
  
  // Check for anomalies in the most recent readings
  const recentReadings = sensorData.slice(-10); // Last 10 readings
  
  let anomalyCount = 0;
  recentReadings.forEach(reading => {
    // Check if any reading exceeds normal thresholds
    if (reading.temperature > 80 || reading.vibration > 0.8) {
      anomalyCount++;
    }
  });
  
  // Calculate anomaly factor
  const anomalyFactor = anomalyCount / recentReadings.length;
  
  // Adjust risk based on anomalies (up to 50% increase)
  return Math.min(baseRisk * (1 + (anomalyFactor * 0.5)), 1.0);
};

/**
 * Calculate days until maintenance is recommended
 * @param {number} risk - Maintenance risk score
 * @returns {number} - Days until maintenance
 */
const calculateDaysUntilMaintenance = (risk) => {
  if (risk >= 0.9) {
    return 0; // Immediate maintenance needed
  } else if (risk >= 0.7) {
    return 7; // Within a week
  } else if (risk >= 0.5) {
    return 14; // Within two weeks
  } else if (risk >= 0.3) {
    return 30; // Within a month
  } else {
    return 90; // Within three months
  }
};

/**
 * Generate maintenance recommendations
 * @param {string} assetType - Type of asset
 * @param {number} risk - Maintenance risk score
 * @param {number} daysUntilMaintenance - Days until maintenance
 * @returns {Array} - Array of recommendation strings
 */
const generateRecommendations = (assetType, risk, daysUntilMaintenance) => {
  const recommendations = [];
  
  // Add urgency recommendation
  if (risk >= 0.9) {
    recommendations.push('URGENT: Immediate maintenance required.');
  } else if (risk >= 0.7) {
    recommendations.push('Schedule maintenance within the next week.');
  } else if (risk >= 0.5) {
    recommendations.push('Schedule maintenance within the next two weeks.');
  } else if (risk >= 0.3) {
    recommendations.push('Schedule routine maintenance within the next month.');
  } else {
    recommendations.push('No immediate maintenance needed. Continue regular monitoring.');
  }
  
  // Add asset-specific recommendations
  switch (assetType) {
    case 'vehicle':
      if (risk >= 0.5) recommendations.push('Check engine oil and transmission fluid.');
      if (risk >= 0.7) recommendations.push('Inspect brake system and suspension.');
      break;
    case 'drone':
      if (risk >= 0.5) recommendations.push('Check battery health and propeller integrity.');
      if (risk >= 0.7) recommendations.push('Calibrate sensors and inspect motor bearings.');
      break;
    case 'camera':
      if (risk >= 0.5) recommendations.push('Clean lens and check seals.');
      if (risk >= 0.7) recommendations.push('Calibrate image sensors and check night vision capability.');
      break;
    case 'sensor':
      if (risk >= 0.5) recommendations.push('Check power supply and data transmission.');
      if (risk >= 0.7) recommendations.push('Calibrate sensor and replace protective housing.');
      break;
    case 'radio':
      if (risk >= 0.5) recommendations.push('Test signal strength and battery backup.');
      if (risk >= 0.7) recommendations.push('Check antenna connections and replace worn components.');
      break;
    case 'generator':
      if (risk >= 0.5) recommendations.push('Check fuel system and oil levels.');
      if (risk >= 0.7) recommendations.push('Inspect alternator and voltage regulator.');
      break;
    default:
      recommendations.push('Perform standard maintenance checks according to manufacturer guidelines.');
  }
  
  return recommendations;
};