import {
  createAsyncThunk,
  createSlice,
  isPending,
  isFulfilled,
  isRejected
} from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import type { TThunkConfig } from '../types';

import {
  getUserApi,
  loginUserApi,
  registerUserApi,
  logoutApi,
  refreshToken,
  updateUserApi
} from '@api';

import type { TLoginData, TRegisterData } from '@api';
import type { TUser } from '@utils-types';

import { getCookie, setCookie, deleteCookie } from '../../utils/cookie';

type TAuthState = {
  user: TUser | null;
  isAuthChecked: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: TAuthState = {
  user: null,
  isAuthChecked: false,
  isLoading: false,
  error: null
};

const saveTokens = (tokens: { accessToken: string; refreshToken: string }) => {
  setCookie('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
};

export const checkAuth = createAsyncThunk<TUser | null, void, TThunkConfig>(
  'auth/checkAuth',
  async () => {
    const accessToken = getCookie('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');

    if (!accessToken && !savedRefreshToken) {
      return null;
    }

    if (!accessToken) {
      await refreshToken();
    }

    const response = await getUserApi();

    if (!response.success || !response.user) {
      throw new Error('Не удалось проверить авторизацию');
    }

    return response.user;
  },
  {
    condition: (_, { getState }) => {
      const auth = getState().auth;
      return !auth.isAuthChecked && !auth.isLoading;
    }
  }
);

export const loginUser = createAsyncThunk<TUser, TLoginData, TThunkConfig>(
  'auth/login',
  async (data) => {
    const response = await loginUserApi(data);
    saveTokens(response);
    return response.user;
  },
  {
    condition: (_, { getState }) => !getState().auth.isLoading
  }
);

export const registerUser = createAsyncThunk<
  TUser,
  TRegisterData,
  TThunkConfig
>(
  'auth/register',
  async (data) => {
    const response = await registerUserApi(data);
    saveTokens(response);
    return response.user;
  },
  {
    condition: (_, { getState }) => !getState().auth.isLoading
  }
);

export const logoutUser = createAsyncThunk<void, void, TThunkConfig>(
  'auth/logout',
  async () => {
    if (localStorage.getItem('refreshToken')) {
      const response = await logoutApi();

      if (!response.success) {
        throw new Error('Не удалось выйти из аккаунта');
      }
    }

    deleteCookie('accessToken');
    localStorage.removeItem('refreshToken');
  },
  {
    condition: (_, { getState }) => !getState().auth.isLoading
  }
);

export const updateUser = createAsyncThunk<
  TUser,
  Partial<TRegisterData>,
  TThunkConfig
>(
  'auth/updateUser',
  async (data) => {
    const response = await updateUserApi(data);

    if (!response.success || !response.user) {
      throw new Error('Не удалось сохранить профиль');
    }

    return response.user;
  },
  {
    condition: (_, { getState }) => {
      const { user, isLoading } = getState().auth;
      return Boolean(user) && !isLoading;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addMatcher(
        isPending(checkAuth, loginUser, registerUser, logoutUser, updateUser),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        isFulfilled(checkAuth, loginUser, registerUser, logoutUser, updateUser),
        (state) => {
          state.isLoading = false;
          state.isAuthChecked = true;
        }
      )
      .addMatcher(
        isRejected(checkAuth, loginUser, registerUser, logoutUser, updateUser),
        (state, action) => {
          state.isLoading = false;
          state.isAuthChecked = true;
          state.error = action.error.message || 'Не удалось выполнить запрос';
        }
      );
  }
});

export const { clearAuthError } = authSlice.actions;

const authReducer: Reducer<TAuthState> = authSlice.reducer;
export default authReducer;
