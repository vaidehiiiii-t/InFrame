import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Sparkles, Check, Copy, AlertCircle, ArrowRight } from 'lucide-react';
import { eventsApi } from '../api/events';
import { Modal } from '../components/Modal';

export const CreateEventModal = ({ isOpen, onClose, onEventCreated }) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState(today);
  const [retentionDays, setRetentionDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdEvent, setCreatedEvent] = useState(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setName('');
    setEventDate(today);
    setRetentionDays(30);
    setError('');
    setCreatedEvent(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const newEvent = await eventsApi.createEvent({
        name,
        event_date: eventDate,
        retention_days: parseInt(retentionDays, 10),
      });
      setCreatedEvent(newEvent);
      if (onEventCreated) onEventCreated(newEvent);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create event. Please check your inputs.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPin = () => {
    if (createdEvent?.pin_code) {
      navigator.clipboard.writeText(createdEvent.pin_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleViewEvent = () => {
    const id = createdEvent.id;
    handleClose();
    navigate(`/events/${id}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={createdEvent ? "Event Created Successfully!" : "Create New Event"}>
      {createdEvent ? (
        <div className="space-y-6 text-center py-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h4 className="text-xl font-bold text-white">{createdEvent.name}</h4>
            <p className="text-xs text-slate-400 mt-1">
              Share this 8-character PIN with your guests so they can join and view photos
            </p>
          </div>

          {/* PIN Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-brand-500/30 relative group">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
              Event Join PIN
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-extrabold tracking-widest text-brand-300">
                {createdEvent.pin_code}
              </span>
              <button
                id="btn-copy-pin"
                onClick={copyPin}
                title="Copy PIN"
                className="p-2 bg-brand-600/30 hover:bg-brand-600/50 border border-brand-500/40 rounded-xl text-brand-200 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && <span className="text-[11px] text-green-400 mt-1 block">Copied to clipboard!</span>}
          </div>

          <div className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span>Photo Retention Period:</span>
            <span className="font-semibold text-slate-200">{createdEvent.retention_days} days</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Done
            </button>
            <button
              id="btn-goto-created-event"
              onClick={handleViewEvent}
              className="flex-1 py-2.5 px-4 gradient-btn text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-500/20"
            >
              <span>View Event</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Event Name
            </label>
            <input
              id="input-create-event-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya & Leo's Wedding, Tech Summit 2026"
              className="w-full px-3.5 py-2.5 bg-slate-900/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Event Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="input-create-event-date"
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/70 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Photo Retention Period
              </label>
              <span className="text-xs font-bold text-brand-400">{retentionDays} Days</span>
            </div>
            <div className="relative flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input
                id="input-create-event-retention"
                type="range"
                min="1"
                max="180"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Photos and face data will automatically be deleted after this period (max 180 days).
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-create-event-submit"
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 gradient-btn text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Create Event & Generate PIN</span>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
