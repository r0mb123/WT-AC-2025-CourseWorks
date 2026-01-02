import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VenueDetailsPage } from './pages/VenueDetailsPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { UserRole } from './types/api.types';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes - в процессе разработки */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route path="/venues/:id" element={<VenueDetailsPage />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Temporary placeholder pages
// function PlaceholderPage({ title }: { title: string }) {
//   return (
//     <div className="container">
//       <h2>{title}</h2>
//       <p>🚧 Страница в разработке...</p>
//     </div>
//   );
// }

function NotFoundPage() {
  return (
    <div className="container">
      <div className="error-page">
        <h1>404</h1>
        <h2>Страница не найдена</h2>
        <p>Запрашиваемая страница не существует.</p>
        <a href="/" className="btn btn-primary">
          На главную
        </a>
      </div>
    </div>
  );
}

export default App;
