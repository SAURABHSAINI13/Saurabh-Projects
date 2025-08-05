// src/components/AIModelManagement.jsx
import { useState, useEffect } from 'react';
import { request } from '../api/client';

const AIModelManagement = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    region: '',
    targetAssetType: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });

  // Model types and statuses for filter dropdowns
  const modelTypes = ['object-detection', 'anomaly-detection', 'pattern-recognition', 'threat-classification'];
  const modelStatuses = ['Development', 'Testing', 'Production', 'Deprecated'];
  const regions = ['Ladakh', 'Himachal', 'Uttarakhand', 'Sikkim', 'Arunachal'];
  const assetTypes = ['Vehicle', 'Drone', 'Camera', 'Sensor', 'Radio', 'Generator'];

  // Fetch models with current filters and pagination
  const fetchModels = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.region) params.append('region', filters.region);
      if (filters.targetAssetType) params.append('targetAssetType', filters.targetAssetType);
      params.append('page', pagination.page);
      params.append('perPage', pagination.perPage);

      const response = await request(`/ai-models?${params.toString()}`);
      setModels(response.data);
      setPagination({
        ...pagination,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch AI models');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when filters/pagination change
  useEffect(() => {
    fetchModels();
  }, [filters, pagination.page, pagination.perPage]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    // Reset to first page when filters change
    setPagination({ ...pagination, page: 1 });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, page: newPage });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get latest performance metrics
  const getLatestMetrics = (model) => {
    if (!model.performanceMetrics || model.performanceMetrics.length === 0) {
      return { accuracy: 'N/A', precision: 'N/A', recall: 'N/A' };
    }
    
    // Sort by date descending and get the first (most recent) entry
    const sortedMetrics = [...model.performanceMetrics].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    
    return sortedMetrics[0];
  };

  // Get latest version
  const getLatestVersion = (model) => {
    if (!model.versionHistory || model.versionHistory.length === 0) {
      return { version: 'N/A', deployedAt: null };
    }
    
    // Sort by date descending and get the first (most recent) entry
    const sortedVersions = [...model.versionHistory].sort(
      (a, b) => new Date(b.deployedAt) - new Date(a.deployedAt)
    );
    
    return sortedVersions[0];
  };

  return (
    <div className="ai-model-management">
      <h2>AI Model Management</h2>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="type">Model Type:</label>
          <select
            id="type"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            {modelTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            {modelStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="region">Region:</label>
          <select
            id="region"
            name="region"
            value={filters.region}
            onChange={handleFilterChange}
          >
            <option value="">All Regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="targetAssetType">Target Asset Type:</label>
          <select
            id="targetAssetType"
            name="targetAssetType"
            value={filters.targetAssetType}
            onChange={handleFilterChange}
          >
            <option value="">All Asset Types</option>
            {assetTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading indicator */}
      {loading ? (
        <div className="loading">Loading AI models...</div>
      ) : (
        <>
          {/* Models table */}
          <table className="models-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Version</th>
                <th>Confidence Threshold</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    No AI models found matching the current filters.
                  </td>
                </tr>
              ) : (
                models.map((model) => {
                  const latestMetrics = getLatestMetrics(model);
                  const latestVersion = getLatestVersion(model);
                  
                  return (
                    <tr key={model._id}>
                      <td>{model.name}</td>
                      <td>{model.type}</td>
                      <td>
                        <span className={`status-badge ${model.status.toLowerCase()}`}>
                          {model.status}
                        </span>
                      </td>
                      <td>
                        {latestVersion.version}
                        <div className="version-date">
                          {formatDate(latestVersion.deployedAt)}
                        </div>
                      </td>
                      <td>{model.confidenceThreshold ? `${model.confidenceThreshold * 100}%` : 'N/A'}</td>
                      <td>{latestMetrics.accuracy !== 'N/A' ? `${Math.round(latestMetrics.accuracy * 100)}%` : 'N/A'}</td>
                      <td>{latestMetrics.precision !== 'N/A' ? `${Math.round(latestMetrics.precision * 100)}%` : 'N/A'}</td>
                      <td>{latestMetrics.recall !== 'N/A' ? `${Math.round(latestMetrics.recall * 100)}%` : 'N/A'}</td>
                      <td>
                        <button className="btn-view">View</button>
                        <button className="btn-edit">Edit</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
            >
              &laquo;
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              &lt;
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              &gt;
            </button>
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
            >
              &raquo;
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AIModelManagement;