import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import LoadingSpinner from './components/LoadingSpinner';

const HomePage = lazy(() => import('./pages/HomePage'));

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ManageTrades = lazy(() => import('./pages/ManageTrades'));
const ManageCategories = lazy(() => import('./pages/ManageCategories'));
const ManageExams = lazy(() => import('./pages/ManageExams'));
const ManageAnnouncements = lazy(() => import('./pages/ManageAnnouncements'));
const ManageUsers = lazy(() => import('./pages/ManageUsers'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<HomePage />} />
          {/* Remove this line: <Route path='/categories' element={<CategoriesPage />} /> */}
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route path='/profile' element={<UserProfile />} />
          
          {/* Admin Routes */}
          <Route path='/admin/login' element={<AdminLogin />} />
          <Route path='/admin' element={<AdminLayout />}>
            <Route path='dashboard' element={<AdminDashboard />} />
            <Route path='manage-trades' element={<ManageTrades />} />
            <Route path='manage-categories' element={<ManageCategories />} />
            <Route path='manage-exams' element={<ManageExams />} />
            <Route path='manage-announcements' element={<ManageAnnouncements />} />
            <Route path='manage-users' element={<ManageUsers />} />
          </Route>
          
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
