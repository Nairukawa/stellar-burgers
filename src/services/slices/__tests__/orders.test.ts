import { configureStore } from '@reduxjs/toolkit';
import { getOrderByNumberApi, getOrdersApi, orderBurgerApi } from '@api';
import authReducer, { loginUser, logoutUser } from '../auth-slice';
import constructorReducer, { addIngredient } from '../constructor-slice';
import ordersReducer, {
  clearOrderSubmission,
  fetchOrderDetails,
  fetchProfileOrders,
  submitOrder
} from '../orders-slice';
import type { TIngredient, TOrder } from '@utils-types';

jest.mock('@api', () => ({
  getOrderByNumberApi: jest.fn(),
  getOrdersApi: jest.fn(),
  orderBurgerApi: jest.fn(),
  getUserApi: jest.fn(),
  loginUserApi: jest.fn(),
  registerUserApi: jest.fn(),
  logoutApi: jest.fn(),
  refreshToken: jest.fn()
}));

const postOrder = jest.mocked(orderBurgerApi);
const getHistory = jest.mocked(getOrdersApi);
const getPublicOrder = jest.mocked(getOrderByNumberApi);

const user = { name: 'Test User', email: 'test@example.com' };

const ingredient = (id: string, type: string = 'main'): TIngredient => ({
  _id: id,
  name: `Ingredient ${id}`,
  type,
  proteins: 1,
  fat: 2,
  carbohydrates: 3,
  calories: 4,
  price: type === 'bun' ? 100 : 50,
  image: 'test-image',
  image_large: 'test-image-large',
  image_mobile: 'test-image-mobile'
});

const makeOrder = (number: number): TOrder => ({
  _id: `order-${number}`,
  number,
  name: `Test burger ${number}`,
  status: 'done',
  ingredients: ['bun', 'filling', 'bun'],
  createdAt: '2026-11-02T10:00:00.000Z',
  updatedAt: '2026-11-02T10:00:00.000Z'
});

const responseFor = (
  order: TOrder
): Awaited<ReturnType<typeof orderBurgerApi>> => ({
  success: true,
  name: order.name,
  order: {
    ...order,
    price: 250,
    owner: {
      ...user,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }
  }
});

const createTestStore = (loggedIn = true) =>
  configureStore({
    reducer: {
      auth: authReducer,
      burgerConstructor: constructorReducer,
      orders: ordersReducer
    },
    preloadedState: {
      auth: {
        ...authReducer(undefined, { type: 'test/init' }),
        user: loggedIn ? user : null,
        isAuthChecked: true
      }
    }
  });

const fillBurger = (store: ReturnType<typeof createTestStore>) => {
  store.dispatch(addIngredient(ingredient('bun', 'bun')));
  store.dispatch(addIngredient(ingredient('filling')));
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('creating an order', () => {
  it('does not send an order for a guest and preserves their burger', async () => {
    const store = createTestStore(false);
    fillBurger(store);

    await store.dispatch(submitOrder());

    expect(postOrder).not.toHaveBeenCalled();
    expect(store.getState().burgerConstructor.bun?._id).toBe('bun');
    expect(store.getState().burgerConstructor.ingredients).toHaveLength(1);
    expect(store.getState().orders.submission.status).toBe('idle');
  });

  it('requires a bun before contacting the server', async () => {
    const store = createTestStore();
    store.dispatch(addIngredient(ingredient('filling')));

    await store.dispatch(submitOrder());

    expect(postOrder).not.toHaveBeenCalled();
    expect(store.getState().orders.submission.error).toBe(
      'Добавьте булку в бургер'
    );
    expect(store.getState().burgerConstructor.requestId).toBeNull();
    expect(store.getState().burgerConstructor.ingredients).toHaveLength(1);
  });

  it('sends the bun twice and every filling copy, then clears the burger and adds the returned order to history', async () => {
    const store = createTestStore();
    fillBurger(store);
    store.dispatch(addIngredient(ingredient('filling')));
    const returnedOrder = makeOrder(101);
    postOrder.mockResolvedValueOnce(responseFor(returnedOrder));

    await store.dispatch(submitOrder());

    const ingredientIds = ['bun', 'filling', 'filling', 'bun'];
    expect(postOrder).toHaveBeenCalledTimes(1);
    expect(postOrder).toHaveBeenCalledWith(ingredientIds);
    expect(store.getState().burgerConstructor).toEqual({
      bun: null,
      ingredients: [],
      requestId: null
    });
    expect(store.getState().orders.submission).toMatchObject({
      status: 'succeeded',
      error: null,
      order: { number: 101, ingredients: ingredientIds }
    });
    expect(store.getState().orders.history.items).toEqual([
      { ...returnedOrder, ingredients: ingredientIds }
    ]);
  });

  it('sends only one POST while a previous submission is pending', async () => {
    const store = createTestStore();
    fillBurger(store);
    const pending = deferred<Awaited<ReturnType<typeof orderBurgerApi>>>();
    postOrder.mockReturnValueOnce(pending.promise);

    const firstRequest = store.dispatch(submitOrder());
    await store.dispatch(submitOrder());
    store.dispatch(clearOrderSubmission());

    expect(postOrder).toHaveBeenCalledTimes(1);
    expect(store.getState().orders.submission.status).toBe('loading');

    pending.resolve(responseFor(makeOrder(102)));
    await firstRequest;
    expect(store.getState().orders.submission.status).toBe('succeeded');
  });

  it('keeps the burger after a failed request and can retry it', async () => {
    const store = createTestStore();
    fillBurger(store);
    const selectedIngredients = store.getState().burgerConstructor.ingredients;
    postOrder.mockRejectedValueOnce({ message: 'Connection failed' });

    await store.dispatch(submitOrder());

    expect(store.getState().orders.submission).toMatchObject({
      status: 'failed',
      error: 'Connection failed'
    });
    expect(store.getState().burgerConstructor.bun?._id).toBe('bun');
    expect(store.getState().burgerConstructor.ingredients).toEqual(
      selectedIngredients
    );
    expect(store.getState().burgerConstructor.requestId).toBeNull();

    postOrder.mockResolvedValueOnce(responseFor(makeOrder(103)));
    await store.dispatch(submitOrder());
    expect(postOrder).toHaveBeenNthCalledWith(2, ['bun', 'filling', 'bun']);
    expect(store.getState().orders.submission.status).toBe('succeeded');
    expect(store.getState().orders.submission.error).toBeNull();
  });

  it('does not restore an old order or clear a new burger after the session changes', async () => {
    const store = createTestStore();
    fillBurger(store);
    const pending = deferred<Awaited<ReturnType<typeof orderBurgerApi>>>();
    postOrder.mockReturnValueOnce(pending.promise);
    const request = store.dispatch(submitOrder());

    store.dispatch(logoutUser.fulfilled(undefined, 'logout', undefined));
    const credentials = {
      email: 'second@example.com',
      password: 'test-password'
    };
    store.dispatch(loginUser.pending('new-login', credentials));
    store.dispatch(
      loginUser.fulfilled(
        { name: 'Second User', email: credentials.email },
        'new-login',
        credentials
      )
    );
    store.dispatch(addIngredient(ingredient('new-bun', 'bun')));

    pending.resolve(responseFor(makeOrder(104)));
    await request;

    expect(store.getState().orders.submission.order).toBeNull();
    expect(store.getState().orders.history.items).toEqual([]);
    expect(store.getState().burgerConstructor.bun?._id).toBe('new-bun');
  });
});

describe('personal order history', () => {
  it('does not request private history for a guest', async () => {
    const store = createTestStore(false);
    await store.dispatch(fetchProfileOrders());
    expect(getHistory).not.toHaveBeenCalled();
  });

  it('distinguishes an empty successful response from an error and supports retry', async () => {
    const store = createTestStore();
    getHistory.mockResolvedValueOnce([]);

    await store.dispatch(fetchProfileOrders());
    expect(store.getState().orders.history).toMatchObject({
      items: [],
      status: 'succeeded',
      error: null
    });

    getHistory.mockRejectedValueOnce(new Error('History is unavailable'));
    await store.dispatch(fetchProfileOrders());
    expect(store.getState().orders.history).toMatchObject({
      status: 'failed',
      error: 'History is unavailable'
    });

    getHistory.mockResolvedValueOnce([makeOrder(201)]);
    await store.dispatch(fetchProfileOrders());
    expect(
      store.getState().orders.history.items.map((order) => order.number)
    ).toEqual([201]);
    expect(store.getState().orders.history.error).toBeNull();
  });

  it.each(['logout', 'new login'] as const)(
    'ignores a history response arriving after %s',
    async (change) => {
      const store = createTestStore();
      const pending = deferred<TOrder[]>();
      getHistory.mockReturnValueOnce(pending.promise);
      const request = store.dispatch(fetchProfileOrders());

      if (change === 'logout') {
        store.dispatch(logoutUser.fulfilled(undefined, 'logout', undefined));
      } else {
        store.dispatch(
          loginUser.pending('new-login', {
            email: 'second@example.com',
            password: 'test-password'
          })
        );
      }

      pending.resolve([makeOrder(202)]);
      await request;
      expect(store.getState().orders.history).toMatchObject({
        items: [],
        status: 'idle',
        error: null
      });
    }
  );

  it('does not let an older history request remove a newly created order', async () => {
    const store = createTestStore();
    fillBurger(store);
    const oldHistory = deferred<TOrder[]>();
    getHistory.mockReturnValueOnce(oldHistory.promise);
    const historyRequest = store.dispatch(fetchProfileOrders());
    postOrder.mockResolvedValueOnce(responseFor(makeOrder(203)));

    await store.dispatch(submitOrder());
    oldHistory.resolve([]);
    await historyRequest;

    expect(
      store.getState().orders.history.items.map((order) => order.number)
    ).toEqual([203]);
  });

  it.each(['POST', 'GET'] as const)(
    'keeps the new order and older history when %s finishes first',
    async (firstResponse) => {
      const store = createTestStore();
      fillBurger(store);
      const pendingPost =
        deferred<Awaited<ReturnType<typeof orderBurgerApi>>>();
      const pendingHistory = deferred<TOrder[]>();
      postOrder.mockReturnValueOnce(pendingPost.promise);
      getHistory.mockReturnValueOnce(pendingHistory.promise);

      const submissionRequest = store.dispatch(submitOrder());
      const historyRequest = store.dispatch(fetchProfileOrders());
      const previousOrder = makeOrder(204);
      const newOrder = makeOrder(205);

      if (firstResponse === 'POST') {
        pendingPost.resolve(responseFor(newOrder));
        await submissionRequest;

        expect(store.getState().orders.history).toMatchObject({
          status: 'loading',
          requestId: historyRequest.requestId
        });

        pendingHistory.resolve([previousOrder]);
        await historyRequest;
      } else {
        pendingHistory.resolve([previousOrder]);
        await historyRequest;

        pendingPost.resolve(responseFor(newOrder));
        await submissionRequest;
      }

      expect(
        store.getState().orders.history.items.map((order) => order.number)
      ).toEqual([205, 204]);
      expect(store.getState().orders.history).toMatchObject({
        status: 'succeeded',
        error: null,
        requestId: null
      });
      expect(postOrder).toHaveBeenCalledTimes(1);
      expect(getHistory).toHaveBeenCalledTimes(1);
    }
  );
});

describe('order details', () => {
  it('uses only the current user history for a private order and treats other order numbers as not found', async () => {
    const store = createTestStore();
    getHistory.mockResolvedValueOnce([makeOrder(301)]);

    await store.dispatch(fetchOrderDetails({ number: 999, isPrivate: true }));

    expect(getHistory).toHaveBeenCalledTimes(1);
    expect(getPublicOrder).not.toHaveBeenCalled();
    expect(store.getState().orders.details).toMatchObject({
      number: 999,
      isPrivate: true,
      status: 'succeeded',
      order: null
    });
  });

  it('blocks private details for guests but allows a public order', async () => {
    const store = createTestStore(false);
    await store.dispatch(fetchOrderDetails({ number: 302, isPrivate: true }));
    expect(getHistory).not.toHaveBeenCalled();
    expect(getPublicOrder).not.toHaveBeenCalled();

    getPublicOrder.mockResolvedValueOnce({
      success: true,
      orders: [makeOrder(302)]
    });
    await store.dispatch(fetchOrderDetails({ number: 302, isPrivate: false }));
    expect(getPublicOrder).toHaveBeenCalledWith(302);
    expect(store.getState().orders.details.order?.number).toBe(302);
  });

  it.each(['success', 'failure'] as const)(
    'keeps the latest selected order when an older request finishes with %s',
    async (oldResult) => {
      const store = createTestStore(false);
      const first = deferred<Awaited<ReturnType<typeof getOrderByNumberApi>>>();
      const second =
        deferred<Awaited<ReturnType<typeof getOrderByNumberApi>>>();
      getPublicOrder
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);

      const firstRequest = store.dispatch(
        fetchOrderDetails({ number: 303, isPrivate: false })
      );
      const secondRequest = store.dispatch(
        fetchOrderDetails({ number: 304, isPrivate: false })
      );
      second.resolve({ success: true, orders: [makeOrder(304)] });
      await secondRequest;

      if (oldResult === 'success') {
        first.resolve({ success: true, orders: [makeOrder(303)] });
      } else {
        first.reject(new Error('Old request failed'));
      }
      await firstRequest;

      expect(store.getState().orders.details).toMatchObject({
        number: 304,
        status: 'succeeded',
        error: null,
        order: { number: 304 }
      });
    }
  );

  it.each(['logout', 'new login'] as const)(
    'does not show a private detail response after %s',
    async (change) => {
      const store = createTestStore();
      const pending = deferred<TOrder[]>();
      getHistory.mockReturnValueOnce(pending.promise);
      const request = store.dispatch(
        fetchOrderDetails({ number: 305, isPrivate: true })
      );

      if (change === 'logout') {
        store.dispatch(logoutUser.fulfilled(undefined, 'logout', undefined));
      } else {
        store.dispatch(
          loginUser.pending('new-login', {
            email: 'second@example.com',
            password: 'test-password'
          })
        );
      }
      pending.resolve([makeOrder(305)]);
      await request;

      expect(store.getState().orders.details.order).toBeNull();
      expect(store.getState().orders.details.status).toBe('idle');
    }
  );

  it('does not request invalid order numbers', async () => {
    const store = createTestStore(false);
    await store.dispatch(fetchOrderDetails({ number: -1, isPrivate: false }));
    expect(getPublicOrder).not.toHaveBeenCalled();
    expect(store.getState().orders.details).toMatchObject({
      status: 'succeeded',
      order: null
    });
  });
});
