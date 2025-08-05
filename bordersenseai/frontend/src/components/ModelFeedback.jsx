import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, FormControl, FormLabel, RadioGroup, 
  FormControlLabel, Radio, TextField, Typography, Alert, CircularProgress, 
  Chip, Divider } from '@mui/material';
import { ThumbUpAlt, ThumbDownAlt, Comment } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const ModelFeedback = () => {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState([]);
  
  // Form state
  const [correctedLabel, setCorrectedLabel] = useState('');
  const [comments, setComments] = useState('');
  
  // Fetch alert details and any existing feedback
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch alert details
        const alertResponse = await axios.get(`${API_BASE_URL}/api/alerts/${alertId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setAlert(alertResponse.data);
        
        // Fetch existing feedback for this alert
        const feedbackResponse = await axios.get(`${API_BASE_URL}/api/feedback/alert/${alertId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setExistingFeedback(feedbackResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load alert details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (alertId && token) {
      fetchData();
    }
  }, [alertId, token]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!correctedLabel) {
      setError('Please select a corrected label');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      await axios.post(`${API_BASE_URL}/api/feedback`, {
        alertId,
        correctedLabel,
        comments,
        originalPrediction: {
          label: alert.type,
          confidence: alert.confidence
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(true);
      
      // Reset form
      setCorrectedLabel('');
      setComments('');
      
      // Refresh feedback list
      const feedbackResponse = await axios.get(`${API_BASE_URL}/api/feedback/alert/${alertId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setExistingFeedback(feedbackResponse.data);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      if (err.response?.status === 409) {
        setError('You have already submitted feedback for this alert');
      } else {
        setError('Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Get detection type options based on alert type
  const getDetectionOptions = () => {
    // Base options that apply to all alert types
    const options = [
      { value: 'none', label: 'Not a threat (false positive)' },
    ];
    
    // Add specific options based on alert type
    if (alert) {
      if (alert.type === 'person') {
        options.push(
          { value: 'person', label: 'Person (correct)' },
          { value: 'vehicle', label: 'Vehicle (misclassified)' },
          { value: 'animal', label: 'Animal (misclassified)' },
          { value: 'drone', label: 'Drone (misclassified)' }
        );
      } else if (alert.type === 'vehicle') {
        options.push(
          { value: 'vehicle', label: 'Vehicle (correct)' },
          { value: 'person', label: 'Person (misclassified)' },
          { value: 'animal', label: 'Animal (misclassified)' },
          { value: 'drone', label: 'Drone (misclassified)' }
        );
      } else if (alert.type === 'drone') {
        options.push(
          { value: 'drone', label: 'Drone (correct)' },
          { value: 'person', label: 'Person (misclassified)' },
          { value: 'vehicle', label: 'Vehicle (misclassified)' },
          { value: 'aircraft', label: 'Aircraft (misclassified)' },
          { value: 'bird', label: 'Bird (misclassified)' }
        );
      } else if (alert.type === 'anomaly') {
        options.push(
          { value: 'anomaly', label: 'Anomaly (correct)' },
          { value: 'normal', label: 'Normal activity (misclassified)' }
        );
      } else {
        // Generic options for other alert types
        options.push(
          { value: alert.type, label: `${alert.type} (correct)` },
          { value: 'other', label: 'Other (misclassified)' }
        );
      }
    }
    
    return options;
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!alert) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Alert not found or you don't have permission to view it.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/alerts')} 
          sx={{ mt: 2 }}
        >
          Back to Alerts
        </Button>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Submit Feedback
      </Typography>
      
      {/* Alert Details */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alert Details
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
            <Chip 
              label={`Type: ${alert.type}`} 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              label={`Confidence: ${(alert.confidence * 100).toFixed(1)}%`} 
              color={alert.confidence > 0.8 ? "success" : "warning"} 
              variant="outlined" 
            />
            <Chip 
              label={`Severity: ${alert.severity}`} 
              color={alert.severity === 'High' ? "error" : alert.severity === 'Medium' ? "warning" : "info"} 
              variant="outlined" 
            />
            <Chip 
              label={`Location: ${alert.location?.name || 'Unknown'}`} 
              variant="outlined" 
            />
          </Box>
          
          <Typography variant="body2" color="textSecondary">
            Detected at: {new Date(alert.timestamp).toLocaleString()}
          </Typography>
          
          {alert.imageUrl && (
            <Box mt={2} textAlign="center">
              <img 
                src={alert.imageUrl} 
                alt="Alert evidence" 
                style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
              />
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Existing Feedback */}
      {existingFeedback.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Existing Feedback
          </Typography>
          
          {existingFeedback.map((feedback) => (
            <Card key={feedback._id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  {feedback.correctedLabel === alert.type ? (
                    <ThumbUpAlt color="success" sx={{ mr: 1 }} />
                  ) : (
                    <ThumbDownAlt color="error" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="subtitle1">
                    Corrected to: <strong>{feedback.correctedLabel}</strong>
                  </Typography>
                </Box>
                
                {feedback.comments && (
                  <Box display="flex" alignItems="flex-start" mt={1}>
                    <Comment fontSize="small" sx={{ mr: 1, mt: 0.5 }} />
                    <Typography variant="body2">{feedback.comments}</Typography>
                  </Box>
                )}
                
                <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                  Submitted by: {feedback.submittedBy?.username || 'Unknown'} • 
                  {new Date(feedback.receivedAt).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      {/* Feedback Form */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Submit Your Feedback
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Feedback submitted successfully!</Alert>}
          
          <form onSubmit={handleSubmit}>
            <FormControl component="fieldset" sx={{ mb: 3 }} fullWidth>
              <FormLabel component="legend">Correct Classification</FormLabel>
              <RadioGroup 
                value={correctedLabel} 
                onChange={(e) => setCorrectedLabel(e.target.value)}
              >
                {getDetectionOptions().map((option) => (
                  <FormControlLabel 
                    key={option.value} 
                    value={option.value} 
                    control={<Radio />} 
                    label={option.label} 
                  />
                ))}
              </RadioGroup>
            </FormControl>
            
            <TextField
              label="Additional Comments"
              multiline
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="Provide any additional context or details about this detection..."
            />
            
            <Box mt={3} display="flex" justifyContent="space-between">
              <Button 
                variant="outlined" 
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={submitting || !correctedLabel}
              >
                {submitting ? <CircularProgress size={24} /> : 'Submit Feedback'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ModelFeedback;