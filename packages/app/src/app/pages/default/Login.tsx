import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, PasswordInput, Checkbox, Button, Title, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import { axios, tokenManager } from '@lib/axios';
import { appStateManager } from '@lib/appState';
import classes from './Login.module.scss';

const Login = () => {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(true);

  // --- Auto-Redirect Logic ---
  const redirectUser = () => {
    const role = appStateManager.getState().role;
    console.log('🔄 Redirecting user with role:', role); // Debug Log

    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'staff') navigate('/staff/dashboard');
    else if (role === 'accountant') navigate('/accountant/dashboard');
    else {
      notifications.show({ title: 'Access Denied', message: `No dashboard for role: ${role}`, color: 'red' });
      navigate('/not-found');
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      // --- FIX 3: Check hint first ---
      // If we don't have the "has_active_session" flag, we assume the user is 
      // not logged in and skip the network request entirely.
      const hasSessionHint = localStorage.getItem('has_active_session');

      if (!hasSessionHint) {
        setIsSubmitting(false); // Show login form immediately
        return;
      }

      try {
        await tokenManager.retrieveCurrentToken();
        redirectUser();
      } catch (e) {
        setIsSubmitting(false);
      }
    };
    checkSession();
  }, []);

  const [emailCredentials, setEmailCredentials] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleEmailInputChange = (field: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailCredentials({ ...emailCredentials, [field]: e.target.value });
  };

  const handleEmailRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailCredentials({ ...emailCredentials, rememberMe: e.target.checked });
  };

  const handleEmailLogin = async () => {
    if (emailCredentials.email === '' || emailCredentials.password === '' || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1. Login (Backend sets HttpOnly Cookie)
      await axios.post('/iam/v1/authenticate/email', {
        email: emailCredentials.email,
        password: emailCredentials.password,
        rememberMe: emailCredentials.rememberMe,
      });

      // 2. Refresh Token (Gets Access Token & Decodes State)
      await tokenManager.refreshAccessToken();

      // 3. Redirect
      notifications.show({ title: 'Welcome!', message: 'Logged in successfully', color: 'green' });
      redirectUser();

    } catch (error) {
      console.error('Login error:', error);
      notifications.show({ title: 'Login Failed', message: 'Invalid email or password', color: 'red' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className={classes.wrapper}>
      <div className={classes.loginBox}>
        <div className={classes.formContainer}>
          <Title order={2} className={classes.title} ta="center" m={20}>
            Invoice System
          </Title>

          <TextInput
            label="Email address"
            placeholder="hello@example.com"
            mt="md"
            size="sm"
            ref={emailInputRef}
            value={emailCredentials.email}
            onChange={handleEmailInputChange('email')}
            disabled={isSubmitting}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            mt="md"
            size="sm"
            value={emailCredentials.password}
            onChange={handleEmailInputChange('password')}
            disabled={isSubmitting}
          />
          <Tooltip label="Do not use this feature on public or shared devices">
            <Checkbox
              label="Remember me for 7 days"
              mt="sm"
              size="sm"
              checked={emailCredentials.rememberMe}
              onChange={handleEmailRememberMeChange}
              disabled={isSubmitting}
            />
          </Tooltip>

          <Button fullWidth mt="xl" size="sm" onClick={handleEmailLogin} disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </Button>
        </div>
        <div className={classes.ribbon1} />
        <div className={classes.ribbon2} />
        <div className={classes.ribbon3} />
        <div className={classes.animationContainer}>
          <DotLottieReact className={classes.lottiePlayer} src="./images/landscape.lottie" loop autoplay />
        </div>
      </div>
    </div>
  );
}

export default Login;