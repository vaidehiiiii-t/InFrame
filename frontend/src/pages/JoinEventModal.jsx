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
      <form onSubmit={handleSubmit} className="space-y-5 text-black">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#f5f5f7] border border-[#e5e5e5] flex items-center justify-center text-black mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <p className="text-xs text-neutral-600 font-normal leading-relaxed max-w-xs mx-auto">
            Enter the 8-character PIN code provided by your event organizer to access the gallery.
          </p>
        </div>

        {error && (
          <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
            isRateLimited 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {isRateLimited ? (
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            )}
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="eyebrow-mono block text-center mb-2">
            Event Access PIN
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
            className="w-full text-center font-mono text-2xl tracking-[0.25em] font-bold py-3.5 bg-white border border-[#e5e5e5] rounded-xl text-black placeholder:text-neutral-300 focus:outline-none focus:border-black focus:ring-2 focus:ring-black uppercase transition-all"
          />
          <p className="caption-mono text-center text-neutral-500 mt-2">
            Rate-limited for event security (max 5 attempts/hr)
          </p>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#f0f0f0]">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary text-xs py-2 px-4"
          >
            Cancel
          </button>
          <button
            id="btn-join-pin-submit"
            type="submit"
            disabled={isSubmitting || pinCode.length < 6}
            className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
