import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Kiosk from './Kiosk';

const users = [
  { id: 1, name: '測試甲', phone: '5550001234', checked_in_today: '0' },
  { id: 2, name: '測試乙', phone: '5551111234', checked_in_today: '1' }
];
const reply = data => ({ ok: true, json: async () => data });
beforeEach(() => {
  window.history.replaceState({}, '', '/kiosk');
  global.fetch = jest.fn().mockResolvedValue(reply(users));
});
afterEach(() => jest.restoreAllMocks());

test('shows unchecked string status and explains already checked in matches', async () => {
  render(<Kiosk />);
  await waitFor(() => expect(screen.getByText('重新載入名單')).toBeEnabled());
  fireEvent.change(screen.getByPlaceholderText('請輸入'), { target: { value: '1234' } });
  expect(await screen.findByText(/測試甲/)).toBeInTheDocument();
  expect(screen.queryByText(/測試乙/)).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('1 位符合的人員今天已簽到');
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('reports an HTTP failure and recovers using reload without retyping', async () => {
  fetch.mockResolvedValueOnce({ ok: false });
  render(<Kiosk />);
  expect(await screen.findByText(/名單載入失敗/)).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('請輸入'), { target: { value: '234' } });
  expect(screen.getByText(/名單載入失敗/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('重新載入名單'));
  expect(await screen.findByText(/測試甲/)).toBeInTheDocument();
});

test('rejects an unexpected response instead of presenting an empty list', async () => {
  fetch.mockResolvedValueOnce(reply({ error: 'unavailable' }));
  render(<Kiosk />);
  expect(await screen.findByText(/名單載入失敗/)).toBeInTheDocument();
});

test('explains no matches after loading the latest list', async () => {
  render(<Kiosk />);
  await waitFor(() => expect(screen.getByText('重新載入名單')).toBeEnabled());
  fireEvent.change(screen.getByPlaceholderText('請輸入'), { target: { value: '9999' } });
  expect(await screen.findByRole('status')).toHaveTextContent('找不到符合的人員');
});
