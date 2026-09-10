import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { eventsApi } from '../api/events';
import { Modal } from '../components/Modal';

export const JoinEventModal = ({ isOpen, onClose, onEventJoined }) => {
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const navigate = useNavigate();

  const handleClose = () => {
    setPinCode('');
    setError('');
    setIsRateLimited(false);
    onClose();
  };

  const handlePinChange = (e) => {
    // Force uppercase and limit to 12 alphanumeric characters
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    setPinCode(val);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pinCode.length < 6) {
      setError('PIN must be at least 6 characters.');
      return;
    }

    setError('');
    setIsRateLimited(false);
    setIsSubmitting(true);

    try {
      const res = await eventsApi.joinEvent(pinCode);
      const eventId = res.event.id;
      if (onEventJoined) onEventJoined(res.event);
      handleClose();
      navigate(`/events/${eventId}`);
    } catch (err) {
      if (err.response?.status === 429) {
        setIsRateLimited(true);
        setError(err.response.data?.detail || 'Too many attempts. Please try again later.');
      } else {
        setError(err.response?.data?.detail || 'Invalid event PIN code.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Join Event with PIN">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400">
            Enter the 8-character PIN code provided by your event host to access the gallery
          </p>
        </div>

        {error && (
          <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
            isRateLimited 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {isRateLimited ? (
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider text-center">
            Event PIN Code
          </label>
          <input
            id="input-join-pin"
            type="text"
            required
            autoFocus
            maxLength={12}
            value={pinCode}
            onChange={handlePinChange}
            placeholder="e.g. 8K2M9PX7"
            className="w-full text-center font-mono text-2xl tracking-[0.25em] font-bold py-3.5 bg-slate-900/90 border-2 border-slate-700 rounded-xl text-brand-300 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all uppercase"
          />
          <p className="text-[11px] text-slate-500 text-center mt-2">
            Rate-limited for event security (max 5 attempts/hour)
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-join-pin-submit"
            type="submit"
            disabled={isSubmitting || pinCode.length < 6}
            className="py-2.5 px-5 gradient-btn text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Join Event</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
