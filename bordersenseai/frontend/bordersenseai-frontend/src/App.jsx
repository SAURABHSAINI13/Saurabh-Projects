import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { socket } from './socket';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DataUpload from './components/DataUpload';
import AlertsView from './components/AlertsView';
import PatrolPlanner from './components/PatrolPlanner';
import ReportGenerator from './components/ReportGenerator';
import ProtectedRoute from './components/ProtectedRoute';
import SecurityDashboard from './components/SecurityDashboard';
import SecurityReviewChecklist from './components/SecurityReviewChecklist';
import SecurityTest from './components/SecurityTest';

import OfficerView from './pages/OfficerView';
import CommanderView from './pages/CommanderView';
import AdminView from './pages/AdminView';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Logout from './pages/Logout';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import AssetManagement from './pages/AssetManagement';

import useAuth from './hooks/useAuth';
import { ROLES } from './utils/roleUtils';



import { Page } from './types';
import { INITIAL_ALERTS, INITIAL_REPORTS } from './constants';
import './styles/global.css';

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState(Page.Dashboard);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const addAlert = useCallback((newAlert) => {
    setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
  }, []);

  const addReport = useCallback((newReport) => {
    setReports((prevReports) => [newReport, ...prevReports]);
  }, []);

  useEffect(() => {
    const onConnect = () => console.log("✅ connected:", socket.id);
    const onHello = (msg) => console.log("hello event:", msg);
    const onError = (err) => console.error("connect_error:", err);
    const onDisconnect = (reason) => console.warn("disconnected:", reason);

    socket.on("connect", onConnect);
    socket.on("hello", onHello);
    socket.on("connect_error", onError);
    socket.on("disconnect", onDisconnect);

    // quick round-trip test
    socket.emit("ping", "hi");

    return () => {
      socket.off("connect", onConnect);
      socket.off("hello", onHello);
      socket.off("connect_error", onError);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const renderPage = () => {
    switch (currentPage) {
      case Page.Dashboard:
        return <Dashboard alerts={alerts} reports={reports} />;
      case Page.DataUpload:
        return (
          <DataUpload
            addAlert={addAlert}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        );
      case Page.Alerts:
        return <AlertsView alerts={alerts} />;
      case Page.PatrolPlanner:
        return (
          <PatrolPlanner
            setIsLoading={setIsLoading}
            setError={setError}
          />
        );
      case Page.ReportGenerator:
        return (
          <ReportGenerator
            alerts={alerts}
            addReport={addReport}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        );
      default:
        return <Dashboard alerts={alerts} reports={reports} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      {isAuthenticated && (
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      )}

      <main className="p-4 sm:p-6 lg:p-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        {error && (
          <div className="fixed top-5 right-5 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 animate-pulse">
            <p>
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Route-based navigation */}
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected routes - Field Officer */}
          <Route 
            path="/officer" 
            element={
              <ProtectedRoute requiredRoles={[ROLES.FIELD_OFFICER]}>
                <OfficerView />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes - Command Center */}
          <Route 
            path="/commander" 
            element={
              <ProtectedRoute requiredRoles={[ROLES.COMMAND_CENTER]}>
                <CommanderView />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes - Admin */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
                <AdminView />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes - Multiple roles */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/help" 
            element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/logout" 
            element={
              <ProtectedRoute>
                <Logout />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/assets" 
            element={
              <ProtectedRoute requiredRoles={[ROLES.COMMAND_CENTER, ROLES.ADMIN]}>
                <AssetManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Security routes - Admin only */}
          <Route 
            path="/security/dashboard" 
            element={
              <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
                <SecurityDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/security/review" 
            element={
              <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
                <SecurityReviewChecklist />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/security/test" 
            element={
              <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
                <SecurityTest />
              </ProtectedRoute>
            } 
          />
          
          {/* Dashboard and internal pages */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <div>
                  {renderPage()}
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}