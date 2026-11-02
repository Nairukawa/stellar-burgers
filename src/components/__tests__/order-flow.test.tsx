import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import authReducer from '../../services/slices/auth-slice';
import ingredientsReducer from '../../services/slices/ingredients-slice';
import constructorReducer from '../../services/slices/constructor-slice';
import ordersReducer from '../../services/slices/orders-slice';
import {
  getIngredientsApi,
  getOrdersApi,
  getOrderByNumberApi,
  loginUserApi,
  orderBurgerApi
} from '@api';
import type { TIngredient, TOrder } from '@utils-types';

jest.mock('@api');

const bun: TIngredient = {
  _id: 'bun-1',
  name: 'Тестовая булка',
  type: 'bun',
  proteins: 10,
  fat: 2,
  carbohydrates: 20,
  calories: 150,
  price: 100,
  image: 'bun.png',
  image_mobile: 'bun.png',
  image_large: 'bun.png'
};
const filling: TIngredient = {
  ...bun,
  _id: 'main-1',
  name: 'Тестовая начинка',
  type: 'main',
  price: 50
};
const order: TOrder = {
  _id: 'order-1',
  number: 12345,
  name: 'Тестовый бургер',
  status: 'done',
  createdAt: '2026-11-02T12:00:00.000Z',
  updatedAt: '2026-11-02T12:00:00.000Z',
  ingredients: ['bun-1', 'main-1', 'bun-1']
};

let App: typeof import('../app/app').default;

beforeAll(() => {
  const modalRoot = document.createElement('div');
  modalRoot.id = 'modals';
  document.body.appendChild(modalRoot);
  global.IntersectionObserver = class {
    root = null;
    rootMargin = '';
    thresholds = [0];
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
    takeRecords = () => [];
  } as unknown as typeof IntersectionObserver;
  Element.prototype.scrollIntoView = jest.fn();
  App = require('../app/app').default;
});

beforeEach(() => {
  localStorage.clear();
  document.cookie =
    'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  jest.mocked(getIngredientsApi).mockResolvedValue([bun, filling]);
  jest.mocked(loginUserApi).mockResolvedValue({
    success: true,
    accessToken: 'Bearer test-access',
    refreshToken: 'test-refresh',
    user: { name: 'Тестовый пользователь', email: 'test@example.com' }
  });
  jest.mocked(orderBurgerApi).mockResolvedValue({
    success: true,
    name: order.name,
    order: {
      ...order,
      price: 250,
      owner: {
        name: 'Тестовый пользователь',
        email: 'test@example.com',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    }
  });
  jest.mocked(getOrdersApi).mockResolvedValue([order]);
});

test('guest builds a burger, signs in, submits once and sees the order in personal history', async () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      ingredients: ingredientsReducer,
      burgerConstructor: constructorReducer,
      orders: ordersReducer
    }
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </Provider>
  );

  const bunCard = (await screen.findByText(bun.name)).closest('li');
  const fillingCard = screen.getByText(filling.name).closest('li');
  expect(bunCard).not.toBeNull();
  expect(fillingCard).not.toBeNull();
  fireEvent.click(within(bunCard!).getByRole('button', { name: 'Добавить' }));
  fireEvent.click(
    within(fillingCard!).getByRole('button', { name: 'Добавить' })
  );
  expect(store.getState().burgerConstructor.ingredients).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: 'Оформить заказ' }));
  const emailInput = await screen.findByRole('textbox');
  expect(orderBurgerApi).not.toHaveBeenCalled();
  expect(store.getState().burgerConstructor.bun?._id).toBe(bun._id);

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(document.querySelector('input[name="password"]')!, {
    target: { value: 'test-password' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

  const orderButton = await screen.findByRole('button', {
    name: 'Оформить заказ'
  });
  expect(store.getState().burgerConstructor.ingredients).toHaveLength(1);
  expect(orderBurgerApi).not.toHaveBeenCalled();
  fireEvent.click(orderButton);

  const historyLink = await screen.findByRole('link', {
    name: 'Перейти в историю заказов'
  });
  expect(orderBurgerApi).toHaveBeenCalledTimes(1);
  expect(orderBurgerApi).toHaveBeenCalledWith(['bun-1', 'main-1', 'bun-1']);
  expect(store.getState().burgerConstructor.bun).toBeNull();
  expect(store.getState().burgerConstructor.ingredients).toEqual([]);

  fireEvent.click(historyLink);
  await screen.findByText(order.name);
  expect(getOrdersApi).toHaveBeenCalled();
  expect(store.getState().orders.history.items).toEqual([order]);

  const orderLink = screen.getByText(order.name).closest('a');
  expect(orderLink).not.toBeNull();
  fireEvent.click(orderLink!);
  await screen.findByText('Состав:');
  await waitFor(() =>
    expect(store.getState().orders.details.order?.number).toBe(order.number)
  );
  expect(getOrderByNumberApi).not.toHaveBeenCalled();
});
