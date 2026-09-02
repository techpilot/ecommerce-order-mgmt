import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/app-shell';
import { ProtectedRoute } from '../components/auth/protected-route';
import { LoginPage } from '../features/auth/login-page';
import { RegisterPage } from '../features/auth/register-page';
import { useInitAuth } from '../features/auth/use-auth';
import { OrdersPage } from '../features/orders/orders-page';
import { ProductsPage } from '../features/products/products-page';

export function App() {
  useInitAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/orders" replace />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/products" element={<ProductsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
}

export default App;
