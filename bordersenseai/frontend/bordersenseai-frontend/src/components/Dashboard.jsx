// src/components/Dashboard.jsx

import { useState, useEffect } from 'react';
import AlertList from './AlertList.jsx';
import RealTimeAlerts from './RealTimeAlerts.jsx';
import FeedbackForm from './FeedbackForm.jsx';
import UserSelector from './UserSelector.jsx';
import PatrolPlanner from './PatrolPlanner.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [assignedOfficer, setAssignedOfficer] = useState('');
  const [newAlertCount, setNewAlertCount] = useState(0);

  // Handle incoming real-time alerts
  const handleNewAlert = (alert) => {
    setNewAlertCount((c) => c + 1);
    console.log('New real-time alert received:', alert);
  };

  // Reset new alert count when an alert is selected
  useEffect(() => {
    if (selectedAlert) setNewAlertCount(0);
  }, [selectedAlert]);

  return (
    <div className="container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="flex-col">
          <div className="flex justify-between items-center">
            <h1 className="dashboard-title">BorderSenseAI Dashboard</h1>
            {newAlertCount > 0 && (
              <div className="badge high">
                {newAlertCount} New
              </div>
            )}
          </div>
          <p className="dashboard-subtitle">
            Real-time situational awareness & patrol coordination
          </p>
        </div>

        <div className="dashboard-actions">
          <RealTimeAlerts onNewAlert={handleNewAlert} />
          <button className="button secondary">Optimize Patrol</button>
          <button className="button outline">View Assets</button>
        </div>
      </header>

      {/* Main layout */}
      <div className="dashboard-grid">
        {/* Main content */}
        <div className="flex-col">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Alerts</h2>
            </div>
            <div className="card-content">
              <AlertList
                onSelect={setSelectedAlert}
                selectedAlert={selectedAlert}
              />
            </div>
          </div>

          {selectedAlert && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Feedback for Alert</h2>
              </div>
              <div className="card-content">
                <FeedbackForm alert={selectedAlert} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex-col">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Patrol Planning</h2>
            </div>
            <div className="card-content">
              <PatrolPlanner />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Assign Officer</h2>
            </div>
            <div className="card-content">
              <UserSelector
                roleFilter="PatrolOfficer"
                selectedId={assignedOfficer}
                onSelect={setAssignedOfficer}
              />
              {assignedOfficer && (
                <div className="small">
                  Assigned to: <span style={{ fontWeight: 600 }}>{assignedOfficer}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
            </div>
            <div className="card-content">
              <div className="flex-col">
                <button className="button" onClick={() => console.log('Recalculate routes')}>Recalculate Routes</button>
                <button className="button" onClick={() => console.log('Export overview')}>Export Overview</button>
                <button className="button ghost" onClick={() => window.location.reload()}>
                  Refresh Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
