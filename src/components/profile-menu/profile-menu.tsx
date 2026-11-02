import { FC } from 'react';
import { useLocation } from 'react-router-dom';
import { ProfileMenuUI } from '@ui';

import { useDispatch, useSelector } from '../../services/store';
import { selectAuth } from '../../services/selectors/auth-selectors';
import { logoutUser } from '../../services/slices/auth-slice';

export const ProfileMenu: FC = () => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(selectAuth);

  const handleLogout = () => {
    if (isLoading) return;

    dispatch(logoutUser());
  };

  return (
    <>
      <ProfileMenuUI handleLogout={handleLogout} pathname={pathname} />
      {isLoading && <p>Выходим из аккаунта...</p>}
      {error && <p>{error}</p>}
    </>
  );
};
