/**
 * Navbar Component
 * 
 * A top navigation bar for the application, featuring:
 * - A brand name that reloads the dashboard on click.
 * - A logout button with a tooltip for user convenience.
 * 
 * @component
 */
import React from 'react'; // Core React library
import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip } from '@mui/material'; // MUI components for layout and styling
import { styled } from '@mui/material/styles'; // MUI styling utility
import { Logout } from '@mui/icons-material'; // Logout icon from Material-UI icons
import { useAuth } from './App'; // Custom hook for authentication context

/**
 * StyledAppBar
 * - Customizes the default Material-UI `AppBar` component.
 * - Sets a custom background color and shadow using the theme.
 * 
 * @param {object} theme - The Material-UI theme object for consistent styling.
 */
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#1876D2', // Custom background color for the app bar
  boxShadow: theme.shadows[2], // Applies a subtle shadow for elevation
}));

/**
 * Navbar Component
 * - Displays the application brand name and logout button.
 * - Provides a tooltip for the logout action.
 * - Includes a refresh mechanism that reloads the dashboard when the brand name is clicked.
 */
const Navbar = () => {
  const { logout } = useAuth(); // Access the logout function from the authentication context

  /**
   * handleRefresh
   * - Reloads the page and navigates to the dashboard.
   * - This is a full-page reload, ensuring the dashboard is fully refreshed.
   */
  const handleRefresh = () => {
    window.location.href = '/dashboard'; // Force a full page reload to the dashboard
  };

  return (
    /**
     * AppBar Component
     * - Acts as the top navigation bar of the application.
     * - Styled with custom background and shadow using `StyledAppBar`.
     */
    <StyledAppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography
            variant="h6" // Defines the text style for the brand name
            component="div" // Renders the brand name as a div
            sx={{
              fontWeight: 'bold', // Makes the brand name bold
              cursor: 'pointer', // Changes the cursor to pointer to indicate interactivity
              '&:hover': { color: 'lightgray' }, // Changes color on hover for visual feedback
            }}
            onClick={handleRefresh} // Calls handleRefresh when the brand name is clicked
          >
            Briefly
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Logout" arrow placement="bottom">
            <IconButton
              onClick={logout} // Calls the logout function on click
              sx={{
                color: 'white', // Sets the icon color to white
                '&:hover': {
                  color: 'lightgray', // Changes icon color on hover
                },
              }}
            >
              <Logout />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar; // Export the component for use in other parts of the application
