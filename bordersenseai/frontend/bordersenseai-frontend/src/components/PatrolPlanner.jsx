import React, { useState, useCallback } from 'react';

const PatrolPlanner = ({ setIsLoading, setError }) => {
  const [params, setParams] = useState({
    unitId: 'U4-B',
    currentLocation: 'Post 14',
    destination: 'Ridge 7',
    weather: 'Clear, -15°C',
    knownThreats: 'Avalanche warning',
    startDate: '',
    endDate: '',
    patrolUnits: 5,
    coverageArea: 'sector-a',
    prioritizeHotspots: true,
    includeNightPatrols: false,
  });
  const [patrolPlan, setPatrolPlan] = useState(null);
  const [singleRoute, setSingleRoute] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const generateMockRoute = (request) => {
    return {
      routeName: `Route from ${request.currentLocation} to ${request.destination}`,
      mapImageUrl: 'https://via.placeholder.com/600x400?text=Route+Map',
      rationale: `This route avoids known threats (${request.knownThreats}) and is optimized for current weather conditions (${request.weather}).`,
      waypoints: [
        `${request.currentLocation} (Start)`,
        'Checkpoint Alpha',
        'Hilltop Observation Post',
        `${request.destination} (End)`,
      ],
    };
  };

  const generateMockPatrolPlan = (params) => {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const dayDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const routes = [];

    for (let i = 0; i < dayDiff; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dayPatrols = [];
      const patrolsPerDay = params.patrolUnits;

      for (let j = 0; j < patrolsPerDay; j++) {
        const startHour = params.includeNightPatrols
          ? Math.floor(Math.random() * 24)
          : 6 + Math.floor(Math.random() * 12);
        const duration = 2 + Math.floor(Math.random() * 4);
        const patrol = {
          id: `patrol-${i}-${j}`,
          date: currentDate.toISOString().split('T')[0],
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${(startHour + duration).toString().padStart(2, '0')}:00`,
          unit: `Unit ${String.fromCharCode(65 + (j % 5))}`,
          area: params.coverageArea,
          route: params.prioritizeHotspots ? 'Hotspot-optimized route' : 'Standard coverage route',
          personnel: 2 + Math.floor(Math.random() * 3),
        };
        dayPatrols.push(patrol);
      }
      routes.push({
        date: currentDate.toISOString().split('T')[0],
        patrols: dayPatrols,
      });
    }

    return {
      summary: {
        totalDays: dayDiff,
        totalPatrols: dayDiff * params.patrolUnits,
        coverageArea: params.coverageArea,
        optimizationFocus: params.prioritizeHotspots ? 'Threat hotspots' : 'Even coverage',
      },
      routes,
    };
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const validateInputs = () => {
    if (!params.unitId || !params.currentLocation || !params.destination) {
      return 'Unit ID, current location, and destination are required.';
    }
    if (!params.startDate || !params.endDate) {
      return 'Please select both start and end dates.';
    }
    if (new Date(params.startDate) > new Date(params.endDate)) {
      return 'End date must be after start date.';
    }
    if (params.patrolUnits < 1 || params.patrolUnits > 20) {
      return 'Patrol units must be between 1 and 20.';
    }
    return null;
  };

  const handleGeneratePlan = useCallback(async (e) => {
    e.preventDefault();
    const error = validateInputs();
    if (error) {
      setError(error);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPatrolPlan(null);
    setSingleRoute(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const single = generateMockRoute(params);
      const plan = generateMockPatrolPlan(params);
      setSingleRoute(single);
      setPatrolPlan(plan);
    } catch (err) {
      console.error('Plan generation failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [params, setIsLoading, setError]);

  const styles = {
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    card: { background: '#1f2937', padding: '20px', borderRadius: '8px', marginBottom: '24px', color: '#fff' },
    input: { width: '100%', padding: '8px', background: '#374151', border: '1px solid #4b5563', borderRadius: '4px', color: '#fff' },
    button: { background: '#2563eb', padding: '10px 20px', borderRadius: '4px', color: '#fff', cursor: 'pointer', border: 'none', width: '100%' },
    buttonHover: { background: '#1d4ed8' },
    label: { display: 'block', marginBottom: '8px', color: '#9ca3af' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: '#374151', padding: '8px', textAlign: 'left', fontSize: '14px' },
    td: { padding: '8px', borderTop: '1px solid #4b5563' },
  };

  return (
    <div style={styles.container}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Patrol Route Planner</h2>
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Patrol Parameters</h3>
          <form onSubmit={handleGeneratePlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={styles.label}>Unit ID</label>
              <input type="text" name="unitId" value={params.unitId} onChange={handleInputChange} style={styles.input} required />
            </div>
            <div>
              <label style={styles.label}>Current Location</label>
              <input type="text" name="currentLocation" value={params.currentLocation} onChange={handleInputChange} style={styles.input} required />
            </div>
            <div>
              <label style={styles.label}>Destination</label>
              <input type="text" name="destination" value={params.destination} onChange={handleInputChange} style={styles.input} required />
            </div>
            <div>
              <label style={styles.label}>Weather Conditions</label>
              <input type="text" name="weather" value={params.weather} onChange={handleInputChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Known Threats</label>
              <input type="text" name="knownThreats" value={params.knownThreats} onChange={handleInputChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Start Date</label>
              <input type="date" name="startDate" value={params.startDate} onChange={handleInputChange} style={styles.input} required />
            </div>
            <div>
              <label style={styles.label}>End Date</label>
              <input type="date" name="endDate" value={params.endDate} onChange={handleInputChange} style={styles.input} required />
            </div>
            <div>
              <label style={styles.label}>Patrol Units Available</label>
              <input
                type="number"
                name="patrolUnits"
                min="1"
                max="20"
                value={params.patrolUnits}
                onChange={handleNumberChange}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Coverage Area</label>
              <select name="coverageArea" value={params.coverageArea} onChange={handleInputChange} style={styles.input}>
                <option value="sector-a">Sector A - North Border</option>
                <option value="sector-b">Sector B - East Border</option>
                <option value="sector-c">Sector C - South Border</option>
                <option value="sector-d">Sector D - West Border</option>
                <option value="all">All Sectors</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                name="prioritizeHotspots"
                checked={params.prioritizeHotspots}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              <label style={{ ...styles.label, margin: '0' }}>Prioritize Threat Hotspots</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                name="includeNightPatrols"
                checked={params.includeNightPatrols}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              <label style={{ ...styles.label, margin: '0' }}>Include Night Patrols</label>
            </div>
            <button type="submit" style={styles.button}>Generate Patrol Plan</button>
          </form>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <div style={styles.card}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Generated Plan</h3>
            {singleRoute && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: '#60a5fa' }}>{singleRoute.routeName}</h4>
                <img src={singleRoute.mapImageUrl} alt="Route Map" style={{ width: '100%', height: '256px', objectFit: 'cover', borderRadius: '8px' }} />
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontWeight: '600', color: '#d1d5db' }}>Rationale:</p>
                  <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>{singleRoute.rationale}</p>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontWeight: '600', color: '#d1d5db' }}>Waypoints:</p>
                  <ul style={{ listStyle: 'decimal', paddingLeft: '20px', color: '#d1d5db' }}>
                    {singleRoute.waypoints.map((wp, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{wp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {patrolPlan && (
              <>
                <div style={{ background: '#374151', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Summary</h3>
                  <div style={styles.grid}>
                    <div>
                      <p style={{ fontSize: '14px', color: '#9ca3af' }}>Total Days</p>
                      <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{patrolPlan.summary.totalDays}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: '#9ca3af' }}>Total Patrols</p>
                      <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{patrolPlan.summary.totalPatrols}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: '#9ca3af' }}>Coverage Area</p>
                      <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        {patrolPlan.summary.coverageArea === 'all' ? 'All Sectors' : patrolPlan.summary.coverageArea.replace('-', ' ').toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: '#9ca3af' }}>Optimization Focus</p>
                      <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{patrolPlan.summary.optimizationFocus}</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {patrolPlan.routes.slice(0, 7).map(day => (
                    <div key={day.date} style={{ borderTop: '1px solid #4b5563', paddingTop: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>{formatDate(day.date)}</h3>
                      <table style={styles.table}>
                        <thead>
                          <tr style={{ textAlign: 'left', fontSize: '14px', background: '#374151' }}>
                            <th style={styles.th}>Unit</th>
                            <th style={styles.th}>Time</th>
                            <th style={styles.th}>Personnel</th>
                            <th style={styles.th}>Route Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.patrols.map(patrol => (
                            <tr key={patrol.id} style={{ borderTop: '1px solid #4b5563' }}>
                              <td style={styles.td}>{patrol.unit}</td>
                              <td style={styles.td}>{patrol.startTime} - {patrol.endTime}</td>
                              <td style={styles.td}>{patrol.personnel}</td>
                              <td style={styles.td}>{patrol.route}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
                {patrolPlan.routes.length > 7 && (
                  <div style={{ marginTop: '16px', textAlign: 'center', color: '#9ca3af' }}>
                    Showing first 7 days of the patrol plan.
                  </div>
                )}
              </>
            )}
            {!patrolPlan && !singleRoute && (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '128px 0' }}>
                <p>Generated plan will be displayed here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatrolPlanner;