import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, LogOut, Plus, KeyRound, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onOpenCreateModal, onOpenJoinModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand Wordmark & Tag */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:scale-105">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-[-0.04em] text-black leading-tight">
                Event<span className="font-extrabold">Snap</span>
              </span>
              <span className="eyebrow-mono text-[9px] -mt-0.5 text-neutral-500">
                Figma-Inspired Delivery
              </span>
            </div>
          </Link>

          {/* Action Controls & Pill Navigation */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {isAuthenticated ? (
              <>
                {/* Secondary Pill CTA: Join with PIN */}
                <button
                  id="btn-nav-join"
                  onClick={onOpenJoinModal}
                  className="btn-secondary text-xs py-1.5 px-4 inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-black" />
                  <span>Join with PIN</span>
                </button>

                {/* Primary Pill CTA: Create Event */}
                <button
                  id="btn-nav-create"
                  onClick={onOpenCreateModal}
                  className="btn-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Event</span>
                </button>

                {/* User Dropdown / Profile Initial */}
                <div className="flex items-center gap-2 pl-2 border-l border-[#e5e5e5]">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full bg-[#f5f5f7] border border-[#e5e5e5] flex items-center justify-center text-black font-semibold text-xs"
                      title={user?.name || 'Account'}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <span className="hidden md:inline text-xs font-medium text-black">
                      {user?.name}
                    </span>
                  </div>

                  <button
                    id="btn-nav-logout"
                    onClick={handleLogout}
                    title="Log out"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-black hover:bg-[#f5f5f7] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  id="link-login"
                  className="btn-secondary text-xs py-1.5 px-4 inline-flex items-center"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  id="link-signup"
                  className="btn-primary text-xs py-1.5 px-4 inline-flex items-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Marquee Ribbon per DESIGN.md: thin black ribbon under nav */}
      <div className="w-full bg-black text-white h-8 flex items-center justify-between px-4 sm:px-8 text-[11px] font-mono uppercase tracking-[0.06em] overflow-hidden whitespace-nowrap border-b border-[#222]">
        <div className="flex items-center gap-6 animate-pulse-slow">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D2F46E]"></span>
            Face Rekognition Photo Hub
          </span>
          <span className="text-neutral-500 hidden sm:inline">•</span>
          <span className="hidden sm:inline text-neutral-300">Instant 8-Character PIN Access</span>
          <span className="text-neutral-500 hidden md:inline">•</span>
          <span className="hidden md:inline text-neutral-300">Zero App Install Required</span>
          <span className="text-neutral-500 hidden lg:inline">•</span>
          <span className="hidden lg:inline text-neutral-300">Encrypted AWS S3 Architecture</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-neutral-400">
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white">Milestone 1 Active</span>
        </div>
      </div>
    </>
  );
};
