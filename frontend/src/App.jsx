import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { EventDetail } from './pages/EventDetail';
import { CreateEventModal } from './pages/CreateEventModal';
import { JoinEventModal } from './pages/JoinEventModal';

export const App = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEventCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleEventJoined = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#090D16] text-slate-100 selection:bg-brand-500 selection:text-white">
          <Navbar
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenJoinModal={() => setIsJoinModalOpen(true)}
          />

          <main className="flex-1">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Event Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard
                      key={refreshKey}
                      onOpenCreateModal={() => setIsCreateModalOpen(true)}
                      onOpenJoinModal={() => setIsJoinModalOpen(true)}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId"
                element={
                  <ProtectedRoute>
                    <EventDetail />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Global Modals */}
          <CreateEventModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onEventCreated={handleEventCreated}
          />
          <JoinEventModal
            isOpen={isJoinModalOpen}
            onClose={() => setIsJoinModalOpen(false)}
            onEventJoined={handleEventJoined}
          />

          {/* Footer */}
          <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-500">
            <p>EventSnap &bull; Intelligent Event Photo Sharing &bull; Milestone 1</p>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
