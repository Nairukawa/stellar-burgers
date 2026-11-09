import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';

import { Preloader } from '@ui';
import { useSelector } from '../../services/store';
import { selectAuth } from '../../services/selectors/auth-selectors';

type ProtectedRouteProps = {
  children: ReactElement;
  onlyUnAuth?: boolean;
};

type AuthLocationState = {
  from?: Location;
};

export const ProtectedRoute = ({
  children,
  onlyUnAuth = false
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, isAuthChecked } = useSelector(selectAuth);

  if (!isAuthChecked) {
    return <Preloader />;
  }

  if (!onlyUnAuth && !user) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }

  if (onlyUnAuth && user) {
    const from = (location.state as AuthLocationState | null)?.from;

    return <Navigate to={from || '/'} replace state={from?.state} />;
  }

  return children;
};
