import { Routes, Route } from 'react-router';
import { lazy, Suspense } from 'react';
import { PageLoader } from '@/components/PageLoader';

const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Admin = lazy(() => import('@/pages/Admin'));
const Profile = lazy(() => import('@/pages/Profile'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const NeighborhoodPage = lazy(() => import('@/pages/NeighborhoodPage'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/neighborhood/:slug" element={<NeighborhoodPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
