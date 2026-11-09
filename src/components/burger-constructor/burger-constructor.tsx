import { FC } from 'react';
import { Button } from '@zlden/react-developer-burger-ui-components';
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
} from '../../services/slices/order-submission-slice';

export const BurgerConstructor: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthChecked, isLoading } = useSelector(selectAuth);
  const constructorItems = useSelector(selectConstructor);
  const price = useSelector(selectConstructorPrice);
  const submission = useSelector(selectOrderSubmission);
  const isSubmitting = submission.status === 'loading';

  const onOrderClick = () => {
    if (
      !isAuthChecked ||
      isLoading ||
      isSubmitting ||
      constructorItems.requestId !== null
    ) {
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!constructorItems.bun) return;

    dispatch(submitOrder());
  };

  const closeOrderModal = () => {
    dispatch(clearOrderSubmission());
  };

  if (submission.status === 'failed') {
    return (
      <div>
        <p role='alert' className='text text_type_main-default mb-4'>
          {submission.error || 'Не удалось оформить заказ'}
        </p>
        <Button htmlType='button' type='secondary' onClick={closeOrderModal}>
          Вернуться к конструктору
        </Button>
      </div>
    );
  }

  return (
    <BurgerConstructorUI
      price={price}
      orderRequest={submission.isModalOpen && isSubmitting}
      constructorItems={constructorItems}
      orderModalData={submission.isModalOpen ? submission.order : null}
      onOrderClick={onOrderClick}
      closeOrderModal={closeOrderModal}
    />
  );
};
