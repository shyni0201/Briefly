import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * Styled component for custom toggle button appearance.
 * Extends MUI ToggleButton with custom colors and hover states.
 * 
 * @component
 * @param {object} theme - MUI theme object
 * @returns {Component} Styled ToggleButton component
 */
const CustomToggleButton = styled(ToggleButton)(({ theme }) => ({
  textAlign: 'center',
  flex: 0.18,
  '&.Mui-selected': {
    backgroundColor: '#1976D2',
    color: theme.palette.common.white, // White text for better contrast
    '&:hover': {
      backgroundColor: '#115293', // Darker shade for hover
    },
  },
  '&.Mui-selected:hover': {
    backgroundColor: '#115293', // Ensure hover color works when selected
  },
}));

/**
 * SummaryToggle Component - Toggles between personal and shared summaries view.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.currentView - Current selected view ('my-summaries' or 'shared-summaries')
 * @param {function} props.onToggleChange - Callback function when toggle selection changes
 * @returns {JSX.Element} Toggle button group for switching between summary views
 */
const SummaryToggle = ({ currentView, onToggleChange }) => {
  /**
   * Handles toggle button selection change.
   * Only updates if a valid view is selected (prevents deselection).
   * 
   * @param {Event} event - The event object
   * @param {string} newView - The newly selected view value
   */
  const handleChange = (event, newView) => {
    if (newView !== null) {
      onToggleChange(newView);
    }
  };

  return (
    <ToggleButtonGroup
      value={currentView}
      exclusive
      onChange={handleChange}
      sx={{ mb: 3, display: 'flex'}}
    >
      <CustomToggleButton value="my-summaries">
        My Summaries
      </CustomToggleButton>
      <CustomToggleButton value="shared-summaries">
        Shared Summaries
      </CustomToggleButton>
    </ToggleButtonGroup>
  );
};

export default SummaryToggle;
