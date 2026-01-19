import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Title, Text, Anchor, Group, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { IconUser, IconMail, IconLock } from '@tabler/icons-react';

import { axios } from '@lib/axios';

import classes from './Register.module.scss';

const Register = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: keyof typeof formValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [field]: e.target.value,
    });
  };

  const handleRegister = () => {
    if (!formValues.fullName || !formValues.email || !formValues.password) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please fill in all fields',
        color: 'red',
      });
      return;
    }

    if (formValues.password !== formValues.confirmPassword) {
      notifications.show({
        title: 'Validation Error',
        message: 'Passwords do not match',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);

    axios
      .post('/iam/v1/register', {
        fullName: formValues.fullName,
        email: formValues.email,
        password: formValues.password,
      })
      .then(() => {
        notifications.show({
          title: 'Success',
          message: 'Account created successfully. Please login.',
          color: 'green',
        });
        navigate('/login');
      })
      .catch((error) => {
        console.error(error);
        notifications.show({
          title: 'Registration failed',
          message: error.response?.data?.message || 'Could not create account. Please try again.',
          color: 'red',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRegister();
    }
  };

  return (
    <div className={classes.wrapper}>
      <div className={classes.registerBox}>
        <div className={classes.formContainer}>
          <Title order={2} className={classes.title} ta="center" m={20}>
            Create Account
          </Title>

          <Stack gap="md">
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              size="sm"
              leftSection={<IconUser size={16} />}
              value={formValues.fullName}
              onChange={handleInputChange('fullName')}
              disabled={isSubmitting}
            />

            <TextInput
              label="Email address"
              placeholder="hello@example.com"
              size="sm"
              leftSection={<IconMail size={16} />}
              value={formValues.email}
              onChange={handleInputChange('email')}
              disabled={isSubmitting}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              size="sm"
              leftSection={<IconLock size={16} />}
              value={formValues.password}
              onChange={handleInputChange('password')}
              disabled={isSubmitting}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm password"
              size="sm"
              leftSection={<IconLock size={16} />}
              value={formValues.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              onKeyDown={handleKeyPress}
              disabled={isSubmitting}
            />

            <Button 
              fullWidth 
              size="md" 
              mt="md"
              className={classes.buttonShadow}
              onClick={handleRegister} 
              loading={isSubmitting}
            >
              Register
            </Button>
          </Stack>

          <Group justify="center" mt="xl">
            <Text size="sm">
              Already have an account?{' '}
              <Anchor<'a'> href="/login" fw={700} onClick={(event) => {
                event.preventDefault();
                navigate('/login');
              }}>
                Log in
              </Anchor>
            </Text>
          </Group>
        </div>

        <div className={classes.ribbon1} />
        <div className={classes.ribbon2} />
        <div className={classes.ribbon3} />

        <div className={classes.animationContainer}>
          <DotLottieReact
            className={classes.lottiePlayer}
            src="./images/landscape.lottie"
            loop
            autoplay
            backgroundColor="#000"
            speed={0.5}
            renderConfig={{
              autoResize: true,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Register;