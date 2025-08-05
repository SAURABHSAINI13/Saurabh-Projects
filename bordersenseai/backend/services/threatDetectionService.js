// backend/services/threatDetectionService.js
import Alert from '../models/Alert.js';
import { broadcastNewAlert } from '../server.js';
import AIModel from '../models/AIModel.js';

/**
 * AI-powered threat detection service that analyzes data from various sources
 * and generates alerts based on detected anomalies or potential threats.
 */

// Confidence threshold for generating alerts
const CONFIDENCE_THRESHOLD = 0.65;

// Cache for AI models to avoid repeated database queries
let modelCache = {};

/**
 * Get an AI model for a specific detection type
 * @param {string} type - The type of detection (e.g., 'object-detection', 'anomaly-detection')
 * @returns {Promise<Object>} - The AI model object
 */
const getAIModel = async (type) => {
  // Check cache first
  if (modelCache[type] && modelCache[type].timestamp > Date.now() - 1000 * 60 * 5) { // 5 minute cache
    return modelCache[type].model;
  }
  
  try {
    // Find an active model of the specified type
    const model = await AIModel.findOne({ 
      type, 
      status: 'Active' 
    }).sort({ 'versionHistory.trainedAt': -1 }).exec();
    
    if (model) {
      // Update cache
      modelCache[type] = {
        model,
        timestamp: Date.now()
      };
      return model;
    }
    
    // If no model found, return null
    return null;
  } catch (error) {
    console.error(`Error fetching AI model for type ${type}:`, error);
    return null;
  }
};

/**
 * Process image data from surveillance cameras or drones
 * @param {Object} imageData - The image data to analyze
 * @param {string} source - Source of the image (camera ID, drone ID, etc.)
 * @param {Object} location - Geo coordinates {lat, lon}
 * @returns {Promise<Object>} - Detection results
 */
export const processImageData = async (imageData, source, location) => {
  try {
    // Get the appropriate AI model for object detection
    const model = await getAIModel('object-detection');
    const modelThreshold = model?.confidenceThreshold || CONFIDENCE_THRESHOLD;
    
    // In a real implementation, this would use a computer vision model
    // For now, we'll simulate detection with random confidence scores
    
    const detectionTypes = ['unauthorized-crossing', 'suspicious-vehicle', 'weapon-detected', 'unknown-object'];
    const detections = [];
    
    // Simulate 0-2 random detections
    const numDetections = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numDetections; i++) {
      const detectionType = detectionTypes[Math.floor(Math.random() * detectionTypes.length)];
      const confidence = 0.5 + (Math.random() * 0.5); // Random confidence between 0.5 and 1.0
      
      detections.push({
        type: detectionType,
        confidence,
        boundingBox: {
          x: Math.random() * 0.8,
          y: Math.random() * 0.8,
          width: 0.1 + (Math.random() * 0.2),
          height: 0.1 + (Math.random() * 0.2)
        }
      });
    }
    
    // Generate alerts for high-confidence detections
    for (const detection of detections) {
      if (detection.confidence >= modelThreshold) {
        const severity = getSeverityForDetection(detection.type, detection.confidence);
        
        const alert = new Alert({
          type: detection.type,
          severity,
          source,
          confidence: detection.confidence,
          geo: location,
          status: 'New',
          // AI model information
          modelId: model?._id,
          modelName: model?.name || 'Default Object Detection',
          modelVersion: model?.currentVersion || '1.0.0',
          detectionData: {
            boundingBox: detection.boundingBox,
            features: [],
            alternativePredictions: []
          },
          imageUrl: imageData.url || null
        });
        
        const savedAlert = await alert.save();
        broadcastNewAlert(savedAlert);
      }
    }
    
    return { detections };
  } catch (error) {
    console.error('Error in image processing:', error);
    throw error;
  }
};

/**
 * Process sensor data (motion, thermal, etc.)
 * @param {Object} sensorData - The sensor data to analyze
 * @param {string} source - Source of the data (sensor ID)
 * @param {Object} location - Geo coordinates {lat, lon}
 * @returns {Promise<Object>} - Detection results
 */
export const processSensorData = async (sensorData, source, location) => {
  try {
    // Get the appropriate AI model for anomaly detection
    const model = await getAIModel('anomaly-detection');
    const modelThreshold = model?.confidenceThreshold || CONFIDENCE_THRESHOLD;
    
    // Simulate anomaly detection in sensor data
    const anomalyScore = Math.random();
    const isAnomaly = anomalyScore > 0.8;
    
    if (isAnomaly && anomalyScore >= modelThreshold) {
      const alert = new Alert({
        type: 'sensor-anomaly',
        severity: anomalyScore > 0.9 ? 'High' : 'Medium',
        source,
        confidence: anomalyScore,
        geo: location,
        status: 'New',
        // AI model information
        modelId: model?._id,
        modelName: model?.name || 'Default Anomaly Detection',
        modelVersion: model?.currentVersion || '1.0.0',
        detectionData: {
          features: sensorData.readings || [],
          alternativePredictions: []
        }
      });
      
      const savedAlert = await alert.save();
      broadcastNewAlert(savedAlert);
    }
    
    return { anomalyDetected: isAnomaly, score: anomalyScore };
  } catch (error) {
    console.error('Error in sensor data processing:', error);
    throw error;
  }
};

/**
 * Process satellite imagery for large-scale anomaly detection
 * @param {Object} satelliteData - The satellite image data
 * @param {Object} region - Region coordinates (bounds)
 * @returns {Promise<Object>} - Detection results
 */
export const processSatelliteData = async (satelliteData, region) => {
  // Get the appropriate AI model for satellite analysis
  const model = await getAIModel('satellite-analysis');
  const modelThreshold = model?.confidenceThreshold || CONFIDENCE_THRESHOLD;
  
  // Implementation would connect to a satellite imagery analysis service
  // For now, return a simulated result with model information
  return {
    analyzed: true,
    anomalies: [],
    modelUsed: model?.name || 'Default Satellite Analysis',
    modelVersion: model?.currentVersion || '1.0.0'
  };
};

/**
 * Determine severity level based on detection type and confidence
 * @param {string} detectionType - Type of detection
 * @param {number} confidence - Confidence score (0-1)
 * @returns {string} - Severity level (Low, Medium, High, Critical)
 */
const getSeverityForDetection = (detectionType, confidence) => {
  // Different detection types have different severity mappings
  switch (detectionType) {
    case 'weapon-detected':
      return confidence > 0.8 ? 'Critical' : 'High';
    case 'unauthorized-crossing':
      return confidence > 0.9 ? 'High' : 'Medium';
    case 'suspicious-vehicle':
      return confidence > 0.85 ? 'High' : 'Medium';
    default:
      return confidence > 0.9 ? 'Medium' : 'Low';
  }
};

/**
 * Clear the model cache
 * Used when models are updated
 */
export const clearModelCache = () => {
  modelCache = {};
  console.log('AI model cache cleared');
};