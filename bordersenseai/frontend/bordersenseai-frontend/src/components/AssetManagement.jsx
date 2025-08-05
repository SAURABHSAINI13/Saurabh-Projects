// src/components/AssetManagement.jsx
import { useState, useEffect } from 'react';
import { request } from '../api/client';

const AssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    region: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });

  // Asset types and statuses for filter dropdowns
  const assetTypes = ['Vehicle', 'Drone', 'Camera', 'Sensor', 'Radio', 'Generator'];
  const assetStatuses = ['Operational', 'Maintenance', 'Offline', 'Deployed'];
  const regions = ['Ladakh', 'Himachal', 'Uttarakhand', 'Sikkim', 'Arunachal'];

  // Fetch assets with current filters and pagination
  const fetchAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.region) params.append('region', filters.region);
      params.append('page', pagination.page);
      params.append('perPage', pagination.perPage);

      const response = await request(`/assets?${params.toString()}`);
      setAssets(response.data);
      setPagination({
        ...pagination,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when filters/pagination change
  useEffect(() => {
    fetchAssets();
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

  // Calculate maintenance risk color
  const getRiskColor = (risk) => {
    if (risk >= 0.7) return 'red';
    if (risk >= 0.4) return 'orange';
    return 'green';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="asset-management">
      <h2>Asset Management</h2>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="type">Asset Type:</label>
          <select
            id="type"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            {assetTypes.map((type) => (
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
            {assetStatuses.map((status) => (
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
      </div>

      {/* Error message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading indicator */}
      {loading ? (
        <div className="loading">Loading assets...</div>
      ) : (
        <>
          {/* Assets table */}
          <table className="assets-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Region</th>
                <th>Health Score</th>
                <th>Maintenance Risk</th>
                <th>Next Maintenance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    No assets found matching the current filters.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id}>
                    <td>{asset.name}</td>
                    <td>{asset.type}</td>
                    <td>
                      <span className={`status-badge ${asset.status.toLowerCase()}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td>{asset.deploymentRegion || 'N/A'}</td>
                    <td>{asset.healthScore ? `${Math.round(asset.healthScore * 100)}%` : 'N/A'}</td>
                    <td>
                      <div 
                        className="risk-indicator" 
                        style={{ backgroundColor: getRiskColor(asset.maintenanceRisk) }}
                      >
                        {asset.maintenanceRisk ? `${Math.round(asset.maintenanceRisk * 100)}%` : 'N/A'}
                      </div>
                    </td>
                    <td>{formatDate(asset.nextScheduledMaintenance)}</td>
                    <td>
                      <button className="btn-view">View</button>
                      <button className="btn-edit">Edit</button>
                    </td>
                  </tr>
                ))
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

export default AssetManagement;