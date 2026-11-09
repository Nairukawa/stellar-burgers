import { FC } from 'react';
import { AppHeaderUI } from '@ui';

import { useSelector } from '../../services/store';
import { selectAuth } from '../../services/selectors/auth-selectors';

export const AppHeader: FC = () => {
  const { user } = useSelector(selectAuth);

  return <AppHeaderUI userName={user?.name || ''} />;
};
