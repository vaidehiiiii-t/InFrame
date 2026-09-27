import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({ name, email, password });
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create account. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col justify-center">
      {/* Mint Accent Banner per DESIGN.md */}
      <div className="block-mint rounded-2xl p-4 sm:p-5 mb-8 border border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B2F1DE]" />
          </div>
          <div>
            <span className="eyebrow-mono text-[10px] block text-neutral-800">Privacy & Security First</span>
            <p className="text-xs text-black font-normal">
              Face rekognition data & photo collections strictly adhere to automatic retention timers.
            </p>
          </div>
        </div>
        <span className="self-start sm:self-center px-3 py-1 rounded-full bg-black text-white text-[10px] font-mono font-medium tracking-wider whitespace-nowrap">
          SECURE STORAGE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Editorial Text */}
        <div className="md:col-span-5 space-y-4">
          <span className="eyebrow-mono">Get Started Today</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-black leading-tight">
            Create your event account.
          </h1>
          <p className="text-sm text-neutral-600 font-normal leading-relaxed">
            Host private gatherings, generate PIN codes for your attendees, and unlock smart face-delivered photo albums.
          </p>

          <div className="pt-2 hidden md:block">
            <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e5] space-y-2">
              <span className="caption-mono block">Organizers & Attendees</span>
              <p className="text-xs text-neutral-700">
                Single sign-on architecture allows both hosting your own celebrations and joining guest galleries.
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="md:col-span-7">
          <div className="card-hairline p-8 sm:p-10 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-black tracking-tight">Create Account</h2>
              <p className="text-xs text-neutral-500 mt-1">Join EventSnap in just a few seconds</p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="eyebrow-mono block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="input-signup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="input-figma pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow-mono block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="input-figma pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow-mono block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input-figma pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-black"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-signup-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 text-sm"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-[#f0f0f0] text-center text-xs text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="text-black font-semibold underline underline-offset-4 hover:opacity-75">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
