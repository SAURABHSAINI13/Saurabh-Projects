import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Circle } from 'react-leaflet';
import io from 'socket.io-client';
import '../styles/components.css';
import 'leaflet/dist/leaflet.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const socket = io(API_URL, { auth: { token: localStorage.getItem('token') } });

const CommanderView = () => {
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);
  const patrolRoute = [[34.0, 77.0], [34.1, 77.1]];
  const threatZones = [{ center: [34.05, 77.05], radius: 1000 }];

  useEffect(() => {
    socket.on('new_alert', (alert) => setAlerts((prev) => [...prev, alert]));
    socket.on('new_report', (report) => setReports((prev) => [...prev, report]));
    socket.on('connect_error', (err) => setError('Connection failed: ' + err.message));
    fetchResources();

    return () => {
      socket.off('new_alert');
      socket.off('new_report');
      socket.off('connect_error');
    };
  }, []);

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API_URL}/api/resources`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch resources');
      const data = await res.json();
      setResources(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="commander-container">
      <h1 className="card-title">Command Center Dashboard</h1>
      {error && <div className="alert danger">{error}</div>}
      <div className="dashboard-container">
        <div className="main-panel">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Patrol Map</h2>
            </div>
            <div className="map-section">
              <MapContainer center={[34.0, 77.0]} zoom={10} style={{ height: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={patrolRoute} color="blue" />
                {threatZones.map((zone, i) => (
                  <Circle key={i} center={zone.center} radius={zone.radius} color="red" />
                ))}
              </MapContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Live Footage</h2>
            </div>
            <div className="footage-section">
              <video src={`${API_URL}/api/drone-feed`} controls style={{ width: '100%' }} aria-label="Live drone footage" />
            </div>
          </div>
        </div>
        <div className="side-panel">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Alerts</h2>
            </div>
            <div className="alerts-container">
              {alerts.map((alert, i) => (
                <div key={i} className={`alert-item ${alert.severity.toLowerCase()}`}>
                  <div className="title">
                    <span>{alert.message}</span>
                    <span className={`badge ${alert.severity.toLowerCase()}`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Ground Reports</h2>
            </div>
            <div className="flex-col">
              {reports.map((report, i) => (
                <div key={i} className="report">
                  <p>{report.text}</p>
                  {report.media && <img src={report.media} alt="Report media" style={{ width: '100px' }} />}
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Resources</h2>
            </div>
            <div className="flex-col">
              {resources.map((res, i) => (
                <div key={i} className="resource">
                  <p>{res.type}: {res.quantity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommanderView;