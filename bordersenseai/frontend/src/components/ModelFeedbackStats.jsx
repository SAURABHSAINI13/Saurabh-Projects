import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Alert, 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Divider } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const ModelFeedbackStats = () => {
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [modelsNeedingRetraining, setModelsNeedingRetraining] = useState([]);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch feedback statistics
        const statsResponse = await axios.get(`${API_BASE_URL}/api/feedback/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setStats(statsResponse.data);
        
        // Fetch models needing retraining
        const modelsResponse = await axios.get(`${API_BASE_URL}/api/ai-models?needsRetraining=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setModelsNeedingRetraining(modelsResponse.data.models || []);
      } catch (err) {
        console.error('Error fetching feedback stats:', err);
        setError('Failed to load feedback statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchData();
    }
  }, [token]);
  
  // Format data for charts
  const prepareLabelData = () => {
    if (!stats || !stats.labelCounts) return [];
    
    return stats.labelCounts.map(item => ({
      name: item._id || 'Unknown',
      value: item.count
    }));
  };
  
  const prepareDailyData = () => {
    if (!stats || !stats.dailyCounts) return [];
    
    return stats.dailyCounts.map(item => ({
      date: item._id,
      count: item.count
    }));
  };
  
  const prepareProcessingData = () => {
    if (!stats || !stats.processedStats) return [];
    
    return [
      { name: 'Processed', value: stats.processedStats.processed },
      { name: 'Unprocessed', value: stats.processedStats.unprocessed }
    ];
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (!stats) {
    return (
      <Box p={3}>
        <Alert severity="info">No feedback statistics available.</Alert>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Model Feedback Analytics
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Feedback
              </Typography>
              <Typography variant="h3">
                {stats.totalFeedback}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Processing Rate
              </Typography>
              <Typography variant="h3">
                {(stats.processedStats.processingRate * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Models Needing Retraining
              </Typography>
              <Typography variant="h3">
                {modelsNeedingRetraining.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Most Common Correction
              </Typography>
              <Typography variant="h5">
                {stats.labelCounts && stats.labelCounts.length > 0 ? 
                  stats.labelCounts[0]._id || 'None' : 'None'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3} mb={4}>
        {/* Label Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feedback by Corrected Label
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareLabelData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {prepareLabelData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} feedbacks`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Daily Feedback */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feedback Submissions (Last 30 Days)
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareDailyData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Submissions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Models Needing Retraining */}
      <Card mb={4}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Models Needing Retraining
          </Typography>
          
          {modelsNeedingRetraining.length === 0 ? (
            <Alert severity="success">
              All models are up to date. No retraining needed at this time.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Model Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Current Version</TableCell>
                    <TableCell>Feedback Count</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modelsNeedingRetraining.map((model) => (
                    <TableRow key={model._id}>
                      <TableCell>{model.name}</TableCell>
                      <TableCell>{model.type}</TableCell>
                      <TableCell>{model.currentVersion || 'N/A'}</TableCell>
                      <TableCell>{model.feedbackCount}</TableCell>
                      <TableCell>
                        <Chip 
                          label={model.status} 
                          color={model.status === 'Training' ? 'warning' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Processing Status */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feedback Processing Status
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareProcessingData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} feedbacks`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Retraining Process
              </Typography>
              <Box p={2}>
                <Typography variant="body1" paragraph>
                  The AI model retraining process works as follows:
                </Typography>
                
                <ol>
                  <li>
                    <Typography variant="body2" paragraph>
                      <strong>Feedback Collection:</strong> Users submit corrections when AI models make incorrect predictions.
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" paragraph>
                      <strong>Threshold Monitoring:</strong> The system tracks false positives and false negatives for each model.
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" paragraph>
                      <strong>Retraining Trigger:</strong> When feedback exceeds thresholds, models are flagged for retraining.
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" paragraph>
                      <strong>Model Update:</strong> Retraining incorporates user feedback to improve accuracy.
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" paragraph>
                      <strong>Deployment:</strong> New model versions are tested and deployed automatically.
                    </Typography>
                  </li>
                </ol>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModelFeedbackStats;