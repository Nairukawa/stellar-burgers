import {
  Route,
  Routes,
  useLocation,
  useMatch,
  useNavigate
} from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useDispatch } from '../../services/store';
import { fetchIngredients } from '../../services/slices/ingredients-slice';
import { checkAuth } from '../../services/slices/auth-slice';

import {
  ConstructorPage,
  Feed,
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  Profile,
  ProfileOrders,
  NotFound404
} from '@pages';

import { AppHeader, Modal, OrderInfo, IngredientDetails } from '@components';

import { ProtectedRoute } from '../protected-route/protected-route';

import '../../index.css';
import styles from './app.module.css';

type LocationState = {
  background?: Location;
};

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const feedOrderMatch = useMatch('/feed/:number');
  const profileOrderMatch = useMatch('/profile/orders/:number');
  const initialLocationKey = useRef(location.key);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchIngredients());
    dispatch(checkAuth());
  }, [dispatch]);

  const background =
    location.key !== initialLocationKey.current
      ? (location.state as LocationState | null)?.background
      : undefined;
  const orderNumber =
    feedOrderMatch?.params.number ?? profileOrderMatch?.params.number;
  const orderTitle = orderNumber ? `#${orderNumber}` : '';

  const closeModal = (fallbackPath: string) => {
    if (background) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  };

  const modalRoutes = (
    <>
      <Route
        path='/feed/:number'
        element={
          <Modal title={orderTitle} onClose={() => closeModal('/feed')}>
            <OrderInfo />
          </Modal>
        }
      />

      <Route
        path='/ingredients/:id'
        element={
          <Modal title='Детали ингредиента' onClose={() => closeModal('/')}>
            <IngredientDetails />
          </Modal>
        }
      />

      <Route
        path='/profile/orders/:number'
        element={
          <ProtectedRoute>
            <Modal
              title={orderTitle}
              onClose={() => closeModal('/profile/orders')}
            >
              <OrderInfo />
            </Modal>
          </ProtectedRoute>
        }
      />
    </>
  );

  return (
    <div className={styles.app}>
      <AppHeader />

      <Routes location={background ?? location}>
        <Route path='/' element={<ConstructorPage />} />
        <Route path='/feed' element={<Feed />} />

        <Route
          path='/login'
          element={
            <ProtectedRoute onlyUnAuth>
              <Login />
            </ProtectedRoute>
          }
        />

        <Route
          path='/register'
          element={
            <ProtectedRoute onlyUnAuth>
              <Register />
            </ProtectedRoute>
          }
        />

        <Route
          path='/forgot-password'
          element={
            <ProtectedRoute onlyUnAuth>
              <ForgotPassword />
            </ProtectedRoute>
          }
        />

        <Route
          path='/reset-password'
          element={
            <ProtectedRoute onlyUnAuth>
              <ResetPassword />
            </ProtectedRoute>
          }
        />

        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path='/profile/orders'
          element={
            <ProtectedRoute>
              <ProfileOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path='/feed/:number'
          element={
            <main className={styles.detailPageWrap}>
              <h1
                className={clsx(
                  styles.detailHeader,
                  'text text_type_digits-default'
                )}
              >
                {orderTitle}
              </h1>
              <OrderInfo />
            </main>
          }
        />

        <Route
          path='/ingredients/:id'
          element={
            <main className={styles.detailPageWrap}>
              <h1
                className={clsx(
                  styles.detailHeader,
                  'text text_type_main-large'
                )}
              >
                Детали ингредиента
              </h1>
              <IngredientDetails />
            </main>
          }
        />

        <Route
          path='/profile/orders/:number'
          element={
            <ProtectedRoute>
              <main className={styles.detailPageWrap}>
                <h1
                  className={clsx(
                    styles.detailHeader,
                    'text text_type_digits-default'
                  )}
                >
                  {orderTitle}
                </h1>
                <OrderInfo />
              </main>
            </ProtectedRoute>
          }
        />

        <Route path='*' element={<NotFound404 />} />
      </Routes>

      {background && <Routes>{modalRoutes}</Routes>}
    </div>
  );
};

export default App;
