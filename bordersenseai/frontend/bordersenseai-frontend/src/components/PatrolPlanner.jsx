// frontend/src/components/PatrolPlanner.jsx
import { useState } from 'react';
import { request } from '../api/client.js';

export default function PatrolPlanner() {
  const [regionId, setRegionId] = useState('sector-7');
  const [route, setRoute] = useState(null);
  const [constraints, setConstraints] = useState({
    maxWaypoints: 10,
    priorityLevel: 'balanced'
  });

  const fetchOptimized = async () => {
    try {
      // Include constraints in the request
      const queryParams = new URLSearchParams({
        regionId,
        maxWaypoints: constraints.maxWaypoints,
        priorityLevel: constraints.priorityLevel
      });
      
      const data = await request(`/routes/optimize?${queryParams.toString()}`);
      setRoute(data);
    } catch (e) {
      alert('Failed to get route: ' + e.message);
    }
  };

  const handleConstraintChange = (field, value) => {
    setConstraints(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="card patrol-planner">
      <h3>AI-Enhanced Patrol Planner</h3>
      <div className="patrol-controls">
        <input
          className="input"
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
          placeholder="Region ID"
        />
        <select 
          className="select"
          value={constraints.priorityLevel}
          onChange={(e) => handleConstraintChange('priorityLevel', e.target.value)}
        >
          <option value="balanced">Balanced</option>
          <option value="safety">Safety Priority</option>
          <option value="efficiency">Efficiency Priority</option>
        </select>
        <input
          className="input"
          type="number"
          min="3"
          max="20"
          value={constraints.maxWaypoints}
          onChange={(e) => handleConstraintChange('maxWaypoints', parseInt(e.target.value))}
          placeholder="Max Waypoints"
        />
        <button className="button" onClick={fetchOptimized}>
          Optimize
        </button>
      </div>
      
      {route && (
        <div className="patrol-results">
          <div className="flex justify-between">
            <div className="small">Optimization Score: {route.optimizationScore.toFixed(2)}</div>
            <div className="small">Region: {route.regionId}</div>
          </div>
          
          {/* AI Model Information */}
          {route.aiModelUsed && (
            <div className="model-info">
              <div className="model-info-title">AI Model Used:</div>
              <div className="model-info-detail">
                <span>Name:</span> {route.aiModelUsed.modelName} v{route.aiModelUsed.modelVersion}
              </div>
              <div className="model-info-detail">
                <span>Confidence Threshold:</span> {route.aiModelUsed.confidenceThreshold.toFixed(2)}
              </div>
            </div>
          )}
          
          <div className="patrol-map">
            {/* Map visualization would go here */}
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="small">Interactive map visualization</span>
            </div>
          </div>
          
          <div className="form-label">Waypoints:</div>
          <ol className="waypoint-list">
            {route.waypoints.map((w, i) => (
              <li key={i} className="waypoint-item">
                <span>Point {i+1}: {w.lat.toFixed(4)}, {w.lon.toFixed(4)}</span>
                <span className="small">ETA: {new Date(w.eta).toLocaleTimeString()}</span>
              </li>
            ))}
          </ol>
          
          <div className="small">
            Created: {new Date(route.createdAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
