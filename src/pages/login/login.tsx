import { FC, SyntheticEvent, useEffect, useState } from 'react';
import { LoginUI } from '@ui-pages';
import { Preloader } from '@ui';

import { useDispatch, useSelector } from '../../services/store';
import { selectAuth } from '../../services/selectors/auth-selectors';
import { clearAuthError, loginUser } from '../../services/slices/auth-slice';

export const Login: FC = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(selectAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();

    if (isLoading) return;

    dispatch(loginUser({ email, password }));
  };

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <LoginUI
      errorText={error || ''}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleSubmit={handleSubmit}
    />
  );
};
