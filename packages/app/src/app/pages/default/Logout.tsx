import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { axios, tokenManager } from '@lib/axios';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Call the logout API to clear server-side cookies
    axios
      .post('/iam/v1/authenticate/logout')
      .catch(() => {
        // Ignore errors, proceed with client-side logout
      })
      .finally(() => {
        // Clear all stored tokens on the client
        tokenManager.clearTokens();

        // Show logout notification
        notifications.show({
          title: 'Logged out',
          message: 'You have been successfully logged out.',
          color: 'blue',
        });

        // Redirect to login page
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  return null; // No UI needed, as it immediately redirects
}

export default Logout