import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Function to create a new user
// Input: userData (object) - Data for the new user
// Output: Promise resolving to the created user data
export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/create`, userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw error.response?.data || 'Error creating user';
  }
};

// Function to verify an existing user
// Input: userData (object) - Data for user verification
// Output: Promise resolving to the verification result
export const verifyUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/verify`, userData); // Send POST request to verify user
    return response.data; // Return the verification result
  } catch (error) {
    console.error('Error verifying user:', error.response?.data || error.message);
    throw error.response?.data || 'Error verifying user';
  }
};

// Function to get user summaries
// Input: userId (string) - ID of the user whose summaries are to be fetched
// Output: Promise resolving to the user's summaries
export const getUserSummaries = async (userId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/summaries/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching summaries:', error.response?.data || error.message);
    throw error.response?.data || 'Error fetching summaries';
  }
};

// Function to create a user summary
// Input: userData (object) - Data for the new summary
// Output: Promise resolving to the created summary data
export const createUserSummary = async (userData) => {
  try {
    const token = localStorage.getItem('auth_token');

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const response = await axios.post(
      `${API_BASE_URL}/summary/create`,
      userData,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating user summary:', error.response?.data || error.message);
    throw error.response?.data || 'Error creating user summary';
  }
};

// Function to upload a user summary
// Input: userData (object) - Data for the upload, including file and metadata
// Output: Promise resolving to the upload result
export const userSummaryUpload = async (userData) => {
  try {
    const token = localStorage.getItem('auth_token');

    const formData = new FormData(); // Create a FormData object for file upload
    formData.append('userId', userData.userId); // Append user ID
    formData.append('type', userData.type); // Append type
    formData.append('uploadType', userData.uploadType); // Append upload type
    formData.append('file', userData.initialData); // Append the file

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const response = await axios.post(
      `${API_BASE_URL}/summary/upload`,
      formData, // Send FormData in the request
      { headers } // Include headers in the request
    );

    return response.data;
  } catch (error) {
    console.error('Error creating user summary:', error.response?.data || error.message);
    throw error.response?.data || 'Error creating user summary';
  }
};

// Function to delete a user summary
// Input: summaryId (string) - ID of the summary to be deleted
// Output: Promise resolving to the response of the delete operation
export const deleteUserSummary = async (summaryId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.delete(`${API_BASE_URL}/summary/${summaryId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response; // Return the response of the delete operation
  } catch (error) {
    console.error('Error deleting summary:', error.response?.data || error.message);
    throw error.response?.data || 'Error deleting summary';
  }
};

// Function to regenerate a user summary
// Input: summaryData (object) - Data for regenerating the summary, including ID and feedback
// Output: Promise resolving to the regenerated summary data
export const regenerateUserSummary = async (summaryData) => {
  try {
    const token = localStorage.getItem('auth_token');

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const response = await axios.post(
      `${API_BASE_URL}/summary/regenerate/${summaryData.summaryId}`,
      summaryData.feedback, // Send feedback for regeneration
      { headers } // Include headers in the request
    );

    return response.data;
  } catch (error) {
    console.error('Error creating user summary:', error.response?.data || error.message);
    throw error.response?.data || 'Error creating user summary';
  }
};

// Function to share a summary
// Input: summaryId (string), recipient (string) - ID of the summary and recipient's information
// Output: Promise resolving to the response of the share operation
export const shareSummary = async (summaryId, recipient) => {
  try {
    const token = localStorage.getItem('auth_token'); // Get auth token
    console.log("Request body:", {
      summary_id: summaryId,
      recipient: recipient,
    });
    const response = await axios.post(
      `${API_BASE_URL}/summary/share`, // Adjust the API endpoint as per your backend
      {
        summary_id: summaryId, // Match the backend key "summary_id"
        recipient: recipient,  // Match the backend key "recipient"
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include authorization token
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data; // Return the response data
  } catch (error) {
    console.error('Error sharing summary:', error.response?.data || error.message);
    throw error.response?.data || 'Error sharing summary';
  }
};

// Function to get shared summaries for a user
// Input: userId (string) - ID of the user whose shared summaries are to be fetched
// Output: Promise resolving to the user's shared summaries
export const getUserSharedSummaries = async (userId) => {
  try {
    const token = localStorage.getItem('auth_token'); // Ensure auth token is available
    const response = await axios.get(`${API_BASE_URL}/user/${userId}/shared-summaries`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log("Shared Summaries fetched from API:", response.data); // Debug API response
    return response.data; // Return the fetched data
  } catch (error) {
    console.error('Error fetching shared summaries:', error.response?.data || error.message);
    throw error.response?.data || 'Error fetching shared summaries';
  }
};

// Function to get a specific user summary
// Input: summaryId (string) - ID of the summary to be fetched
// Output: Promise resolving to the summary data
export const getUserSummary = async (summaryId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/summary/${summaryId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include authorization token
        'Content-Type': 'application/json',
      },
    });
    return response.data; // Return the fetched summary data
  } catch (error) {
    console.error('Error fetching summary for user:', error.response?.data || error.message);
    throw error.response?.data || 'Error fetching summary for user';
  }
};

// Function to get an input file
// Input: fileId (string) - ID of the file to be fetched
// Output: Promise resolving to a Blob object representing the file
export const getInputFile = async (fileId) => {
  try {
    const token = localStorage.getItem('auth_token'); // Retrieve auth token from local storage

    // Fetch the file as a Blob
    const response = await axios.get(`${API_BASE_URL}/download/${fileId}`, {
      responseType: "blob", // Ensure Axios handles the response as binary data
      headers: {
        Authorization: `Bearer ${token}`, // Include authorization token
      },
    });

    // Create a Blob object from the response data
    const blob = new Blob([response.data], { type: response.headers["content-type"] });
    return blob; // Return the Blob object
  } catch (error) {
    console.error("Error fetching or downloading file:", error.response?.data || error.message); // Log error
    throw error.response?.data || "Error fetching or downloading file"; // Throw error for handling
  }
};

