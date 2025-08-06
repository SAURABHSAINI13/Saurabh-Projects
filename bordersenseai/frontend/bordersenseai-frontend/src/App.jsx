import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DataUpload from './components/DataUpload';
import AlertsView from './components/AlertsView';
import PatrolPlanner from './components/PatrolPlanner';
import ReportGenerator from './components/ReportGenerator';
import { Page } from './types';
import { INITIAL_ALERTS, INITIAL_REPORTS } from './constants';
import './styles/global.css';


export default function App() {
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
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
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
        {renderPage()}
      </main>
    </div>
  );
}
