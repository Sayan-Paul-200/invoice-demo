import './app.module.scss';
import { RouterProvider } from 'react-router-dom';
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import { appRouter } from './routes';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';

const theme = createTheme({
  /** Put your mantine theme override here */
});

export function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications position="bottom-left" />
      <RouterProvider router={appRouter} />
    </MantineProvider>
  );
}

export default App;
