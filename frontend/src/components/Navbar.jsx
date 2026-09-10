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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
              Event<span className="text-brand-400">Snap</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-1">
              Smart Photo Delivery
            </span>
          </div>
        </Link>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Join with PIN button */}
              <button
                id="btn-nav-join"
                onClick={onOpenJoinModal}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-all"
              >
                <KeyRound className="w-3.5 h-3.5 text-brand-400" />
                <span>Join with PIN</span>
              </button>

              {/* Create Event button */}
              <button
                id="btn-nav-create"
                onClick={onOpenCreateModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white gradient-btn rounded-lg shadow-md shadow-brand-500/20 hover:shadow-brand-500/40 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Event</span>
              </button>

              {/* User Dropdown / Info */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-900/60 border border-brand-500/40 flex items-center justify-center text-brand-300 font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                  <span className="hidden md:inline text-xs font-medium text-slate-300">
                    {user?.name}
                  </span>
                </div>

                <button
                  id="btn-nav-logout"
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                id="link-login"
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                id="link-signup"
                className="px-4 py-2 text-xs font-semibold text-white gradient-btn rounded-lg transition-all shadow-md shadow-brand-500/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
