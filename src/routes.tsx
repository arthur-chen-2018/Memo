import { createBrowserRouter } from 'react-router';
import MemoListPage from '@/pages/MemoListPage';
import MemoConversationPage from '@/pages/MemoConversationPage';
import ErrorMonitorPage from '@/pages/ErrorMonitorPage';

export const router = createBrowserRouter([
  { path: '/', element: <MemoListPage /> },
  { path: '/memo/:id', element: <MemoConversationPage /> },
  { path: '/errors', element: <ErrorMonitorPage /> },
]);
