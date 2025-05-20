import React, { useState, useEffect } from 'react';
import { Box, Container, CircularProgress } from '@mui/material';
import { useAuth } from './App';
import NewSummaryDialog from './NewSummary';
import SummariesList from './SummariesList';
import { getUserSummaries } from './RequestService';
import Navbar from './Navbar';

const Dashboard = () => {
  const { userData, loading: authLoading } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSummary, setSelectedSummary] = useState(null); 

  /* Load data when the userData or the refreshKey is updated */
  useEffect(() => {
    const fetchSummaries = async () => {
      setLoading(true); // Reset loading state
      try {
        const response = await getUserSummaries(userData.id);
        if (response.status !== "OK") {
          throw new Error('Failed to fetch summaries');
        }
        setSummaries(response.result);
      } catch (error) {
        console.error('Error fetching summaries:', error);
      } finally {
        setLoading(false); // Ensure loading resets
      }
    };
  
    if (userData) {
      fetchSummaries();
    }
  }, [userData, refreshKey]);

  /* Actions to be performed once a new summary is created */  
  const handleNewSummary = async (newSummary) => {
    try {
        setOpenNewDialog(false);
        const response = await getUserSummaries(userData.id);
        if (response.status !== "OK") {
            throw new Error('Failed to fetch summaries');
        }
        
        const updatedSummaries = response.result;
        setSummaries(updatedSummaries);
        const selectedSummary = updatedSummaries.find((summary) => summary.id === newSummary.result.summary_id);
        setSelectedSummary(selectedSummary);
    } catch (error) {
        console.error('Error creating summary:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1); // This will trigger the useEffect
  };

  /* Show the loading screen when set */
  if (authLoading || loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'grey.50'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Rendering the dashboard component
  return (
    <>
      {/* Render Navbar component*/}
      <Navbar />
      <Box sx={{ 
        display: 'flex', 
        height: '100vh',
        bgcolor: 'grey.50'
      }}>
        <Container sx={{ flexGrow: 10, py: 4 }}>
          {/* Render SummariesList component*/}
          <SummariesList 
          selectedSummary={selectedSummary} 
          setSelectedSummary={setSelectedSummary}
          onNewSummaryClick={() => setOpenNewDialog(true)}
          onRefresh={handleRefresh}
          />
        </Container>

        {/* Render New Summary Dialog component*/}
        <NewSummaryDialog
          open={openNewDialog}
          onClose={() => setOpenNewDialog(false)}
          onCreate={(summary) => handleNewSummary(summary)}
        />
      </Box>
    </>
  );
};

export default Dashboard;