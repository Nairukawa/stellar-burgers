import React, { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  ConstructorElement,
  CurrencyIcon
} from '@zlden/react-developer-burger-ui-components';
import styles from './burger-constructor.module.css';
import { BurgerConstructorUIProps } from './type';
import { BurgerConstructorElement, Modal } from '@components';
import { Preloader, OrderDetailsUI } from '@ui';

export const BurgerConstructorUI: FC<BurgerConstructorUIProps> = ({
  constructorItems,
  orderRequest,
  price,
  orderModalData,
  onOrderClick,
  closeOrderModal,
  isOrderModalOpen = true,
  isOrderButtonDisabled = false,
  orderError,
  validationError
}) => (
  <section className={styles.burger_constructor} aria-busy={orderRequest}>
    {constructorItems.bun ? (
      <div className={`${styles.element} mb-4 mr-4`}>
        <ConstructorElement
          type='top'
          isLocked
          text={`${constructorItems.bun.name} (верх)`}
          price={constructorItems.bun.price}
          thumbnail={constructorItems.bun.image}
        />
      </div>
    ) : (
      <div
        className={`${styles.noBuns} ${styles.noBunsTop} ml-8 mb-4 mr-5 text text_type_main-default`}
      >
        Выберите булки
      </div>
    )}
    <ul className={styles.elements}>
      {constructorItems.ingredients.length > 0 ? (
        constructorItems.ingredients.map((item, index) => (
          <BurgerConstructorElement
            ingredient={item}
            index={index}
            totalItems={constructorItems.ingredients.length}
            key={item.id}
          />
        ))
      ) : (
        <li
          className={`${styles.noBuns} ml-8 mb-4 mr-5 text text_type_main-default`}
        >
          Выберите начинку
        </li>
      )}
    </ul>
    {constructorItems.bun ? (
      <div className={`${styles.element} mt-4 mr-4`}>
        <ConstructorElement
          type='bottom'
          isLocked
          text={`${constructorItems.bun.name} (низ)`}
          price={constructorItems.bun.price}
          thumbnail={constructorItems.bun.image}
        />
      </div>
    ) : (
      <div
        className={`${styles.noBuns} ${styles.noBunsBottom} ml-8 mb-4 mr-5 text text_type_main-default`}
      >
        Выберите булки
      </div>
    )}
    <div className={`${styles.total} mt-10 mr-4`}>
      <div className={`${styles.cost} mr-10`}>
        <p className={`text ${styles.text} mr-2`}>{price}</p>
        <CurrencyIcon type='primary' />
      </div>
      <Button
        htmlType='button'
        type='primary'
        size='large'
        disabled={isOrderButtonDisabled || orderRequest}
        onClick={onOrderClick}
      >
        Оформить заказ
      </Button>
    </div>

    {validationError && (
      <p role='alert' className='text text_type_main-default mt-4'>
        {validationError}
      </p>
    )}

    {orderRequest && !isOrderModalOpen && (
      <p role='status' className='text text_type_main-default mt-4'>
        Заказ отправляется. Дождитесь результата перед изменением бургера.
      </p>
    )}

    {isOrderModalOpen && (orderRequest || orderError || orderModalData) && (
      <Modal
        onClose={closeOrderModal}
        title={
          orderRequest
            ? 'Оформляем заказ...'
            : orderError
              ? 'Не удалось оформить заказ'
              : ''
        }
      >
        {orderRequest ? (
          <Preloader />
        ) : orderError ? (
          <>
            <p role='alert' className='text text_type_main-default mb-6'>
              {orderError}
            </p>
            <Button
              htmlType='button'
              type='primary'
              size='medium'
              onClick={onOrderClick}
              disabled={isOrderButtonDisabled}
            >
              Повторить
            </Button>
          </>
        ) : orderModalData ? (
          <>
            <OrderDetailsUI orderNumber={orderModalData.number} />
            <p className='text text_type_main-default mt-6 mb-6'>
              <Link to='/profile/orders' onClick={closeOrderModal}>
                Перейти в историю заказов
              </Link>
            </p>
          </>
        ) : null}
      </Modal>
    )}
  </section>
);
