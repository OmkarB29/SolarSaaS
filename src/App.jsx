import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import MapSelection from './pages/MapSelection';
import Analysis from './pages/Analysis';
import SolarPotential from './pages/SolarPotential';
import PanelOptimizer from './pages/PanelOptimizer';
import Model3DView from './pages/Model3DView';
import MyAnalyses from './pages/MyAnalyses';
import MyProposals from './pages/MyProposals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminAnalyses from './pages/AdminAnalyses';
import AdminReports from './pages/AdminReports';
import AdminAnalytics from './pages/AdminAnalytics';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="map" element={<MapSelection />} />
                <Route path="analysis" element={<Analysis />} />
                <Route path="solar-potential" element={<SolarPotential />} />
                <Route path="panel-optimizer" element={<PanelOptimizer />} />
                <Route path="model-3d" element={<Model3DView />} />
                <Route path="my-analyses" element={<MyAnalyses />} />
                <Route path="analysis-history" element={<MyAnalyses />} />
                <Route path="my-proposals" element={<MyProposals />} />
                <Route path="proposals" element={<MyProposals />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/users" element={<AdminUsers />} />
                <Route path="admin/users/:userId" element={<AdminUserDetail />} />
                <Route path="admin/analyses" element={<AdminAnalyses />} />
                <Route path="admin/reports" element={<AdminReports />} />
                <Route path="admin/analytics" element={<AdminAnalytics />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
