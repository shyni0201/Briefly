import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from './App';
import { getUserSummaries, deleteUserSummary,shareSummary,getUserSharedSummaries, getUserSummary} from './RequestService'; // Import the delete function
import {
  Search, 
  Add,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import SummaryToggle from './SummaryToggle';
import SelectedSummary from './SelectedSummary';

/**
 * Styled Card component with hover effects and shadow transitions
 * 
 * @component
 * @param {object} theme - MUI theme object
 */
const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[3],
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[6],
  },
}));

/**
 * SummariesList Component - Displays and manages user's summaries
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.selectedSummary - Currently selected summary for detailed view
 * @param {Function} props.setSelectedSummary - Function to update selected summary
 * @param {Function} props.onNewSummaryClick - Handler for creating new summary
 * @param {Function} props.onRefresh - Handler for refreshing summaries
 */
const SummariesList = ({ selectedSummary, setSelectedSummary, onNewSummaryClick, onRefresh }) => {
  // State management for component
  const { userData } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentView, setCurrentView] = useState('my-summaries');
  const [sharingSummary, setSharingSummary] = useState(null); // State for sharing summary
  const [recipient, setRecipient] = useState(''); // Recipient email/username
  const [sharing, setSharing] = useState(false); // Sharing state
  const [errorMessage, setErrorMessage] = useState(""); 
  const [sharedSummaries, setSharedSummaries] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [summaryToDelete, setSummaryToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  /**
   * Fetches user's personal summaries from the API
   */
  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const response = await getUserSummaries(userData.id);
      if (response.status !== 'OK') {
        throw new Error('Failed to fetch summaries');
      }
      const data = response.result;
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: result is not an array');
      }
      setSummaries(data);
    } catch (err) {
      console.error('Error fetching summaries:', err);
      setError('Failed to load summaries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches summaries shared with the user
   */
  const fetchSharedSummaries = async () => {
    try {
      setLoading(true);
      const response = await getUserSharedSummaries(userData.id);
      if (response.status !== 'OK') {
        throw new Error('Failed to fetch shared summaries');
      }
      const data = response.result;
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: result is not an array');
      }
      setSharedSummaries(data);
    } catch (err) {
      console.error('Error fetching shared summaries:', err);
      setError('Failed to load shared summaries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect hook to fetch appropriate summaries based on current view
   */
  useEffect(() => {
    if (userData) {
      if (currentView === 'my-summaries') {
        fetchSummaries();
      } else {
        fetchSharedSummaries();
      }
    }
  }, [currentView, userData]);

  /**
   * Handles summary deletion with confirmation
   * @param {string} summaryId - ID of summary to delete
   */
  const handleDeleteSummary = async (summaryId) => {
    try {
      setDeleting(true);
      await deleteUserSummary(summaryId); // Call the delete function
      setSummaries((prev) => prev.filter((summary) => summary.id !== summaryId)); // Optimistically update UI
    } catch (err) {
      console.error('Error deleting summary:', err);
      setError('Failed to delete summary. Please try again later.');
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Initiates sharing process for a summary
   * @param {Object} summary - Summary to be shared
   */
  const handleShareSummary = (summary) => {
    setSharingSummary(summary); // Open the Share dialog
  };

  /**
   * Handles the actual sharing of a summary with a recipient
   */
  const handleSendShare = async () => {
    if (!recipient) {
      alert('Please enter a recipient email or username.');
      return;
    }

    try {
      setSharing(true);
      await shareSummary(sharingSummary.id, recipient); // Call the share API
      alert(`Summary shared successfully with ${recipient}`);
      setSharingSummary(null);
      setRecipient('');
    } catch (err) {
      console.error('Error sharing summary:', err);
      const errorMessage = err.detail;
      setErrorMessage(errorMessage);
    } finally {
      setSharing(false);
    }
  };

  /**
   * Regenerates a summary with updated content
   * @param {Object} summary - Summary to regenerate
   */
  const handleSummaryRegenerate = async (summary) => {
    try{
       // Update the detailed view with the regenerated summary
      const regeneratedSummary = await getUserSummary(summary.id); // Refresh the list of summaries
      setSelectedSummary(regeneratedSummary.result);
    } catch (err) {
      console.error('Error regenerating summary:', err);
    }
  };

  /**
   * Sets the selected summary for detailed view
   * @param {Object} summary - Summary to view
   */
  const handleViewSummary = (summary) => {
    setSelectedSummary(summary); // Set the selected summary for detailed view
  };

  /**
   * Returns to summary list view
   */
  const handleBackToList = () => {
    setSelectedSummary(null);
    setSharingSummary(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  /**
   * Closes all dialogs and resets related states
   */
  const handleCloseDialog = () => {
    setSelectedSummary(null); // Close dialog
    setSharingSummary(null); // Close share dialog
    setRecipient(''); // Reset recipient state
    setErrorMessage(''); // Reset error message state
  };

  /**
   * Opens delete confirmation dialog
   * @param {string} summaryId - ID of summary to delete
   */
  const confirmDeleteSummary = (summaryId) => {
    setSummaryToDelete(summaryId); // Track the summary to delete
    setDeleteDialogOpen(true); // Open the dialog
  };

  /**
   * Filters summaries based on active tab and search query
   */
  const filteredSummaries = summaries.filter((summary) => {
    const matchesTab = activeTab === 'all' || summary.type.toLowerCase() === activeTab;
    const matchesSearch = summary.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          summary.outputData.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch; // Both conditions must be true
  });

  /**
   * Filters shared summaries based on active tab and search query
   */
  const filteredSharedSummaries = sharedSummaries.filter((summary) => {
    const matchesTab = activeTab === 'all' || summary.type.toLowerCase() === activeTab;
    const matchesSearch = summary.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          summary.outputData.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch; // Both conditions must be true
  });

  /**
   * Handles tab change for filtering summaries
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  /**
   * Returns style configuration for summary category chips
   * @param {string} type - Summary type
   * @returns {Object} Style configuration object
   */
  const getCategoryStyles = (type) => {
    switch (type.toLowerCase()) {
      case 'code':
        return { backgroundColor: '#E3F2FD', color: '#1565C0' }; // Light Blue with Dark Blue Text
      case 'research':
        return { backgroundColor: '#F3E5F5', color: '#6A1B9A' }; // Light Purple with Dark Purple Text
      case 'documentation':
        return { backgroundColor: '#E8F5E9', color: '#2E7D32' }; // Light Green with Dark Green Text
      default:
        return { backgroundColor: '#E0E0E0', color: '#616161' }; // Light Grey with Dark Grey Text
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Selected summary detail view
  if (selectedSummary) {
    return (
      <SelectedSummary
        summary={selectedSummary}
        onBack={handleBackToList}
        onSummaryRegenerate={(summary) => handleSummaryRegenerate(summary)}
      />
    );
  }

  // Main list view rendering
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {currentView === 'my-summaries' ? 'My Summaries' : 'Shared Summaries'}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search summaries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          sx={{
            width: '100%',
            maxWidth: '400px', // Limit width of the search bar
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
            },
          }}
        />
        <IconButton sx={{ ml: 1 }}>
          <Search />
        </IconButton>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          sx={{
            ml: 2,
            whiteSpace: 'nowrap',
            height: '40px',
          }}
          onClick={onNewSummaryClick}
        >
          New Summary
        </Button>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab label="All" value="all" />
        <Tab label="Code" value="code" />
        <Tab label="Research" value="research" />
        <Tab label="Documentation" value="documentation" />
      </Tabs>

      <SummaryToggle 
        currentView={currentView}
        onToggleChange={(view) => {
          console.log('Changing view to:', view); // Debug log
          setCurrentView(view === 'my-summaries' ? 'my-summaries' : 'shared-summaries');
          setSearchQuery(''); // Reset search when switching views
        }} 
      />

      <Grid container spacing={4}>
        {(currentView === 'my-summaries' ? filteredSummaries : filteredSharedSummaries).map((summary) => (
          <Grid item xs={12} sm={6} md={4} key={summary.id}>
            <StyledCard
              onClick={() => handleViewSummary(summary)} // Add onClick handler here
              sx={{
                cursor: 'pointer', // Indicate the card is clickable
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }, // Optional hover effect
              }}
            >
              <CardContent>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 1, 
                    fontWeight: 'bold', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}
                >
                  {summary.title || 'Untitled Summary'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    label={summary.type || 'Unknown'}
                    size="small"
                    sx={{
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      ...getCategoryStyles(summary.type), // Dynamic category styles
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      fontStyle: 'italic', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5 
                    }}
                  >
                    <EventNoteIcon fontSize="small" sx={{ color: 'grey.600' }} />
                    {new Date(summary.sharedAt || summary.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                {currentView === 'shared-summaries' && (
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    Shared by: {summary.sharedBy}
                  </Typography>
                )}
                <Typography variant="body1" sx={{ height: '60px', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'justify' }}>
                  {summary.content || summary.outputData || 'No content available for this summary.'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary" onClick={() => handleViewSummary(summary)}>
                  View
                </Button>
                {currentView === 'my-summaries' && (
                  <>
                    <Button
                      size="small"
                      color="secondary"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the card's onClick
                        confirmDeleteSummary(summary.id); // Open confirmation dialog
                      }}
                      disabled={deleting}
                    >
                      Delete
                    </Button>
                    <Button 
                      size="small" 
                      color="primary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareSummary(summary);
                        }
                      }
                    >
                      Share
                    </Button>
                  </>
                )}
              </CardActions>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      {/* Confirmation Dialog for Deletion */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)} // Close dialog on cancel
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Do you really want to delete this summary?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)} // Close dialog
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false); // Close dialog
              handleDeleteSummary(summaryToDelete); // Call delete function
            }}
            color="primary"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Viewing Summary */}
      {selectedSummary && (
        <Dialog open={Boolean(selectedSummary)} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>{selectedSummary.title || 'Untitled Summary'}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Created At: {(Date(selectedSummary.createdAt).split(/[G]/))[0].split("-")}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
              {selectedSummary.content || 'No content available.'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
       {/* Dialog for Sharing Summary */}
       {sharingSummary && (
        <Dialog open={Boolean(sharingSummary)} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>Share Summary: {sharingSummary.title || 'Untitled Summary'} </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Recipient Email or Username"
              variant="outlined"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
            />
             {/* Error Message */}
      {errorMessage && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {errorMessage}
        </Typography>
      )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleSendShare} color="primary" disabled={sharing}>
              {sharing ? 'Sharing...' : 'Share'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default SummariesList;
