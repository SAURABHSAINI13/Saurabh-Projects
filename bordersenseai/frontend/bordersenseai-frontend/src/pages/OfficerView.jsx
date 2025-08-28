import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Circle, Marker } from 'react-leaflet';
import { socket } from '../socket';
import '../styles/components.css';
import 'leaflet/dist/leaflet.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const OfficerView = () => {
  const [messages, setMessages] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [position, setPosition] = useState([34.0, 77.0]);
  const [error, setError] = useState(null);
  const patrolRoute = [[34.0, 77.0], [34.1, 77.1]];
  const threatZones = [{ center: [34.05, 77.05], radius: 1000 }];

  useEffect(() => {
    socket.on('new_alert', (alert) => setAlerts((prev) => [...prev, alert]));
    socket.on('message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('connect_error', (err) => setError('Connection failed: ' + err.message));

    navigator.geolocation.watchPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      (err) => setError('Geolocation error: ' + err.message),
      { enableHighAccuracy: true }
    );

    return () => {
      socket.off('new_alert');
      socket.off('message');
      socket.off('connect_error');
    };
  }, []);

  const sendMessage = useCallback((text) => {
    if (!text.trim()) return;
    const msg = { user: 'Field Officer', text, timestamp: new Date().toISOString() };
    socket.emit('message', msg);
    setMessages((prev) => [...prev, msg]);
  }, []);

  const sendSOS = useCallback(() => {
    const sosAlert = {
      type: 'SOS',
      severity: 'critical',
      geo: { lat: position[0], lon: position[1] },
      message: 'Emergency SOS from Field Officer',
      timestamp: new Date().toISOString(),
    };
    socket.emit('sos', sosAlert);
    setAlerts((prev) => [...prev, sosAlert]);
  }, [position]);

  return (
    <div className="officer-container">
      <h1 className="card-title">Field Officer Interface</h1>
      {error && <div className="alert danger">{error}</div>}
      <div className="dashboard-container">
        <div className="main-panel">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Real-Time Map</h2>
            </div>
            <div className="map-section">
              <MapContainer center={position} zoom={10} style={{ height: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={position} />
                <Polyline positions={patrolRoute} color="blue" />
                {threatZones.map((zone, i) => (
                  <Circle key={i} center={zone.center} radius={zone.radius} color="red" />
                ))}
              </MapContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Chat</h2>
            </div>
            <div className="card-content">
              <div className="alerts-container">
                {messages.map((msg, i) => (
                  <div key={i} className="alert-item">
                    <div className="title">
                      <span>{msg.user}</span>
                      <span className="text-muted">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="input"
                  placeholder="Send a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(e.target.value)}
                  aria-label="Chat input"
                />
              </div>
              <button className="button danger" onClick={sendSOS} aria-label="Send SOS">
                Send SOS
              </button>
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
                  <p>{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerView;