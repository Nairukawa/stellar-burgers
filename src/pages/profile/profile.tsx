import { ChangeEvent, FC, SyntheticEvent, useEffect, useState } from 'react';
import { ProfileUI } from '@ui-pages';
import { Preloader } from '@ui';
import type { TRegisterData } from '@api';

import { useDispatch, useSelector } from '../../services/store';
import { selectAuth } from '../../services/selectors/auth-selectors';
import { clearAuthError, updateUser } from '../../services/slices/auth-slice';

export const Profile: FC = () => {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector(selectAuth);

  const name = user?.name ?? '';
  const email = user?.email ?? '';

  const [formValue, setFormValue] = useState({
    name,
    email,
    password: ''
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    setFormValue({
      name,
      email,
      password: ''
    });
  }, [name, email]);

  const isFormChanged =
    formValue.name !== name ||
    formValue.email !== email ||
    formValue.password !== '';

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault();

    if (!user || isLoading || !isFormChanged) return;

    const data: Partial<TRegisterData> = {
      name: formValue.name,
      email: formValue.email
    };

    if (formValue.password) {
      data.password = formValue.password;
    }

    const result = await dispatch(updateUser(data));

    if (updateUser.fulfilled.match(result)) {
      setFormValue({
        name: result.payload.name,
        email: result.payload.email,
        password: ''
      });
    }
  };

  const handleCancel = (event: SyntheticEvent) => {
    event.preventDefault();

    setFormValue({
      name,
      email,
      password: ''
    });

    dispatch(clearAuthError());
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name: fieldName, value } = event.target;

    setFormValue((previous) => ({
      ...previous,
      [fieldName]: value
    }));
  };

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <ProfileUI
      formValue={formValue}
      isFormChanged={isFormChanged}
      handleCancel={handleCancel}
      handleSubmit={handleSubmit}
      handleInputChange={handleInputChange}
      updateUserError={error || undefined}
    />
  );
};
