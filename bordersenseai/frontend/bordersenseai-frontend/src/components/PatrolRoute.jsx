// src/components/PatrolPlanner.jsx
import { useEffect, useState } from 'react';
import { request } from '../api/client.js';

export default function PatrolPlanner() {
  const [regionId, setRegionId] = useState('sector-7');
  const [route, setRoute] = useState(null);
  const [officers, setOfficers] = useState([]); // ideally fetched from /users
  const [selectedOfficer, setSelectedOfficer] = useState('');
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
      console.error('Optimize route failed', e);
      alert('Failed to get optimized route: ' + e.message);
    }
  };

  const assignRoute = async () => {
    if (!route || !selectedOfficer) return;
    try {
      await request('/routes/assign', {
        method: 'POST',
        body: JSON.stringify({ routeId: route.id || route._id, officerId: selectedOfficer }),
      });
      alert('Route assigned');
    } catch (e) {
      console.error('Assign failed', e);
      alert('Assignment failed: ' + e.message);
    }
  };

  const handleConstraintChange = (field, value) => {
    setConstraints(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Placeholder: load officers (could be from /users endpoint)
  useEffect(() => {
    setOfficers([
      { id: 'officer1', name: 'Officer One' },
      { id: 'officer2', name: 'Officer Two' },
    ]);
    setSelectedOfficer('officer1');
  }, []);

  return (
    <div style={{ border: '1px solid #ddd', padding: 16, marginBottom: 16 }}>
      <h2>AI-Enhanced Patrol Planner</h2>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <label>
            Region ID:{' '}
            <input value={regionId} onChange={(e) => setRegionId(e.target.value)} />
          </label>
        </div>
        <div>
          <label>
            Priority:{' '}
            <select 
              value={constraints.priorityLevel}
              onChange={(e) => handleConstraintChange('priorityLevel', e.target.value)}
            >
              <option value="balanced">Balanced</option>
              <option value="safety">Safety Priority</option>
              <option value="efficiency">Efficiency Priority</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Max Waypoints:{' '}
            <input 
              type="number" 
              min="3" 
              max="20" 
              value={constraints.maxWaypoints}
              onChange={(e) => handleConstraintChange('maxWaypoints', parseInt(e.target.value))}
              style={{ width: '50px' }}
            />
          </label>
        </div>
        <button onClick={fetchOptimized} style={{ marginLeft: 8 }}>
          Get Optimized Route
        </button>
      </div>

      {route && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h4>Route (Score: {route.optimizationScore.toFixed(2)})</h4>
            <div>Region: {route.regionId}</div>
          </div>
          
          {/* AI Model Information */}
          {route.aiModelUsed && (
            <div style={{ 
              backgroundColor: '#f0f8ff', 
              padding: '10px', 
              borderRadius: '5px',
              marginBottom: '10px',
              fontSize: '14px'
            }}>
              <div style={{ fontWeight: 'bold' }}>AI Model Used:</div>
              <div>
                <span style={{ fontWeight: 'medium' }}>Name:</span> {route.aiModelUsed.modelName} v{route.aiModelUsed.modelVersion}
              </div>
              <div>
                <span style={{ fontWeight: 'medium' }}>Confidence Threshold:</span> {route.aiModelUsed.confidenceThreshold.toFixed(2)}
              </div>
            </div>
          )}
          
          <div style={{ fontWeight: 'bold', marginTop: '10px' }}>Waypoints:</div>
          <ol>
            {route.waypoints.map((wp, i) => (
              <li key={i}>
                <span style={{ fontWeight: 'medium' }}>Point {i+1}:</span> {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)} 
                <span style={{ fontSize: '12px', marginLeft: '5px' }}>ETA: {new Date(wp.eta).toLocaleTimeString()}</span>
              </li>
            ))}
          </ol>
          
          <div style={{ marginTop: '15px' }}>
            <label>
              Assign to:{' '}
              <select value={selectedOfficer} onChange={(e) => setSelectedOfficer(e.target.value)}>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={assignRoute} style={{ marginLeft: 8 }}>
              Assign Route
            </button>
          </div>
          
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Created: {new Date(route.createdAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
