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
import { rootReducer } from '../../services/store';
import {
  getIngredientsApi,
  getFeedsApi,
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
  jest.mocked(getFeedsApi).mockResolvedValue({
    success: true,
    orders: [order],
    total: 100,
    totalToday: 10
  });
  jest.mocked(getOrderByNumberApi).mockResolvedValue({
    success: true,
    orders: [order]
  });
});

type TInitialEntry = NonNullable<
  React.ComponentProps<typeof MemoryRouter>['initialEntries']
>[number];

const renderApp = (entry: TInitialEntry = '/', authenticated = false) => {
  const initial = rootReducer(undefined, { type: '@@init' });
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...initial,
      auth: {
        ...initial.auth,
        isAuthChecked: authenticated,
        user: authenticated
          ? { name: 'Тестовый пользователь', email: 'test@example.com' }
          : null
      }
    }
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[entry]}>
        <App />
      </MemoryRouter>
    </Provider>
  );
  return store;
};

test('guest builds a burger, signs in, submits once and sees the order in personal history', async () => {
  const store = renderApp();

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

  await within(document.getElementById('modals')!).findByRole('heading', {
    name: String(order.number)
  });
  expect(
    screen.queryByRole('link', { name: 'Перейти в историю заказов' })
  ).toBeNull();
  expect(orderBurgerApi).toHaveBeenCalledTimes(1);
  expect(orderBurgerApi).toHaveBeenCalledWith(['bun-1', 'main-1', 'bun-1']);
  expect(store.getState().burgerConstructor.bun).toBeNull();
  expect(store.getState().burgerConstructor.ingredients).toEqual([]);

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.getElementById('modals')!.childElementCount).toBe(0);
  fireEvent.click(screen.getByRole('link', { name: 'Тестовый пользователь' }));
  fireEvent.click(await screen.findByRole('link', { name: 'История заказов' }));
  await screen.findByText(order.name);
  expect(getOrdersApi).toHaveBeenCalled();
  expect(store.getState().profileOrders.items).toEqual([order]);

  const orderLink = screen.getByText(order.name).closest('a');
  expect(orderLink).not.toBeNull();
  fireEvent.click(orderLink!);
  await screen.findByText('Состав:');
  await waitFor(() =>
    expect(store.getState().orderDetails.order?.number).toBe(order.number)
  );
  expect(
    within(document.getElementById('modals')!).getByRole('heading', {
      name: '#12345'
    })
  ).toBeTruthy();
  expect(
    screen
      .getByRole('link', { name: 'Тестовый пользователь' })
      .getAttribute('aria-current')
  ).toBe('page');
  expect(getOrderByNumberApi).not.toHaveBeenCalled();
});

describe.each([false, true])(
  'standalone details with saved background = %s',
  (savedBackground) => {
    test.each([
      {
        path: '/ingredients/bun-1',
        title: 'Детали ингредиента',
        content: bun.name,
        authenticated: false,
        section: 'Конструктор',
        background: '/'
      },
      {
        path: '/feed/12345',
        title: '#12345',
        content: order.name,
        authenticated: false,
        section: 'Лента заказов',
        background: '/feed'
      },
      {
        path: '/profile/orders/12345',
        title: '#12345',
        content: order.name,
        authenticated: true,
        section: 'Тестовый пользователь',
        background: '/profile/orders'
      }
    ])(
      '$path renders a page, including after a refresh',
      async ({ path, title, content, authenticated, section, background }) => {
        renderApp(
          {
            pathname: path,
            key: 'initial-details',
            state: savedBackground
              ? {
                  background: {
                    pathname: background,
                    search: '',
                    hash: '',
                    state: null,
                    key: 'old-page'
                  }
                }
              : null
          },
          authenticated
        );

        await screen.findByText(content);
        expect(
          screen.getByRole('heading', { level: 1, name: title })
        ).toBeTruthy();
        expect(document.getElementById('modals')!.childElementCount).toBe(0);
        expect(
          screen
            .getByRole('link', { name: section })
            .querySelector('svg')
            ?.getAttribute('fill')
        ).toBe('#F2F2F3');
        if (authenticated) {
          expect(getOrderByNumberApi).not.toHaveBeenCalled();
          expect(getOrdersApi).toHaveBeenCalled();
        }
      }
    );
  }
);

test.each([
  {
    start: '/',
    card: bun.name,
    title: 'Детали ингредиента',
    section: 'Конструктор'
  },
  {
    start: '/feed',
    card: order.name,
    title: '#12345',
    section: 'Лента заказов'
  }
])(
  'clicking a card from $start opens a modal and preserves the page',
  async ({ start, card, title, section }) => {
    renderApp(start);
    const cardLink = (await screen.findByText(card)).closest('a');
    expect(cardLink).not.toBeNull();
    fireEvent.click(cardLink!);

    const modal = document.getElementById('modals')!;
    await within(modal).findByRole('heading', { name: title });
    expect(
      screen
        .getByRole('link', { name: section })
        .querySelector('svg')
        ?.getAttribute('fill')
    ).toBe('#F2F2F3');
    expect(cardLink!.isConnected).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(modal.childElementCount).toBe(0));
    expect(screen.getByText(card)).toBeTruthy();
  }
);

test('a guest returns to a protected standalone order page after signing in', async () => {
  renderApp('/profile/orders/12345');
  fireEvent.change(await screen.findByRole('textbox'), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(document.querySelector('input[name="password"]')!, {
    target: { value: 'test-password' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

  await screen.findByText('Состав:');
  expect(
    screen.getByRole('heading', { level: 1, name: '#12345' })
  ).toBeTruthy();
  expect(document.getElementById('modals')!.childElementCount).toBe(0);
  expect(getOrderByNumberApi).not.toHaveBeenCalled();
});

test('a failed order is shown by the container and the burger can be retried', async () => {
  jest
    .mocked(orderBurgerApi)
    .mockRejectedValueOnce(new Error('Сервер недоступен'));
  const store = renderApp('/', true);
  const bunCard = (await screen.findByText(bun.name)).closest('li');
  const fillingCard = screen.getByText(filling.name).closest('li');
  fireEvent.click(within(bunCard!).getByRole('button', { name: 'Добавить' }));
  fireEvent.click(
    within(fillingCard!).getByRole('button', { name: 'Добавить' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Оформить заказ' }));

  expect((await screen.findByRole('alert')).textContent).toBe(
    'Сервер недоступен'
  );
  expect(document.getElementById('modals')!.childElementCount).toBe(0);
  expect(store.getState().burgerConstructor.ingredients).toHaveLength(1);
  fireEvent.click(
    screen.getByRole('button', { name: 'Вернуться к конструктору' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Оформить заказ' }));

  await within(document.getElementById('modals')!).findByRole('heading', {
    name: String(order.number)
  });
  expect(orderBurgerApi).toHaveBeenCalledTimes(2);
  expect(store.getState().burgerConstructor.bun).toBeNull();
});
