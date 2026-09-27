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
        <div className="min-h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
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

          {/* Editorial Canvas Footer per DESIGN.md */}
          <footer className="mt-24 border-t border-[#e5e5e5] bg-white pt-16 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                {/* Wordmark column */}
                <div className="col-span-2 space-y-3">
                  <span className="text-xl font-bold tracking-tight text-black">EventSnap</span>
                  <p className="text-xs text-neutral-600 max-w-sm font-normal leading-relaxed">
                    Intelligent event photo sharing with automated face rekognition delivery and zero-install PIN access.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D2F46E] text-black text-[11px] font-mono font-medium">
                      ● System Operational • AWS Rekognition
                    </span>
                  </div>
                </div>

                {/* Column 1 */}
                <div className="space-y-3">
                  <h4 className="caption-mono">Product</h4>
                  <ul className="space-y-2 text-xs text-neutral-600">
                    <li><a href="#" className="hover:text-black hover:underline">Face Delivery</a></li>
                    <li><a href="#" className="hover:text-black hover:underline">Instant PIN Access</a></li>
                    <li><a href="#" className="hover:text-black hover:underline">Event Host Tools</a></li>
                    <li><a href="#" className="hover:text-black hover:underline">Release Notes</a></li>
                  </ul>
                </div>

                {/* Column 2 */}
                <div className="space-y-3">
                  <h4 className="caption-mono">Architecture</h4>
                  <ul className="space-y-2 text-xs text-neutral-600">
                    <li><a href="#" className="hover:text-black hover:underline">FastAPI Engine</a></li>
                    <li><a href="#" className="hover:text-black hover:underline">Amazon S3 Presigned</a></li>
                    <li><a href="#" className="hover:text-black hover:underline">AWS Rekognition</a></li>
                    <li><a href="#" className="hover:text-black hover:underline">PostgreSQL Vector</a></li>
                  </ul>
                </div>

                {/* Column 3 */}
                <div className="space-y-3">
                  <h4 className="caption-mono">Security & Privacy</h4>
                  <ul className="space-y-2 text-xs text-neutral-600">
                    <li><a href="#" className="hover:text-black hover:underline">Data Retention Timer</a></li>
                    <li><a href="#" className="hover:text-black hover:underline">Rate Limiting Guard</a></li>
                    <li><a href="#" className="hover:text-black hover:underline">Privacy Compliance</a></li>
                    <li><a href="#" className="hover:text-black hover:underline">Terms & Rights</a></li>
                  </ul>
                </div>
              </div>

              {/* Bottom rule */}
              <div className="pt-8 border-t border-[#f0f0f0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-mono">
                <p>&copy; {new Date().getFullYear()} EventSnap, Inc. All rights reserved.</p>
                <div className="flex items-center gap-6">
                  <span>DESIGN SYSTEM: FIGMA CANVAS THEME</span>
                  <span>VERSION 1.0.0</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
