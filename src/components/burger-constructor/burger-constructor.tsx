import { FC, useEffect, useState } from 'react';
import { BurgerConstructorUI } from '@ui';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from '../../services/store';
import { selectAuth } from '../../services/selectors/auth-selectors';
import {
  selectConstructor,
  selectConstructorPrice
} from '../../services/selectors/constructor-selectors';
import { selectOrderSubmission } from '../../services/selectors/orders-selectors';
import {
  clearOrderSubmission,
  submitOrder
} from '../../services/slices/orders-slice';

export const BurgerConstructor: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthChecked, isLoading } = useSelector(selectAuth);
  const constructorItems = useSelector(selectConstructor);
  const price = useSelector(selectConstructorPrice);
  const submission = useSelector(selectOrderSubmission);
  const orderRequest = submission.status === 'loading';

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(
    () => submission.status !== 'idle'
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (submission.status === 'succeeded' || submission.status === 'failed') {
      setIsOrderModalOpen(true);
    } else if (submission.status === 'idle') {
      setIsOrderModalOpen(false);
    }
  }, [submission.status]);

  useEffect(() => {
    if (constructorItems.bun) setValidationError(null);
  }, [constructorItems.bun]);

  const onOrderClick = () => {
    if (
      !isAuthChecked ||
      isLoading ||
      orderRequest ||
      constructorItems.requestId !== null
    ) {
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!constructorItems.bun) {
      setValidationError('Добавьте булку, чтобы оформить заказ');
      return;
    }

    setValidationError(null);
    setIsOrderModalOpen(true);
    dispatch(submitOrder());
  };

  const closeOrderModal = () => {
    setIsOrderModalOpen(false);
    if (!orderRequest) dispatch(clearOrderSubmission());
  };

  return (
    <BurgerConstructorUI
      price={price}
      orderRequest={orderRequest}
      constructorItems={constructorItems}
      orderModalData={submission.order}
      onOrderClick={onOrderClick}
      closeOrderModal={closeOrderModal}
      isOrderModalOpen={isOrderModalOpen}
      orderError={
        submission.status === 'failed'
          ? submission.error || 'Не удалось оформить заказ'
          : null
      }
      validationError={validationError}
      isOrderButtonDisabled={
        !isAuthChecked ||
        isLoading ||
        orderRequest ||
        constructorItems.requestId !== null
      }
    />
  );
};
