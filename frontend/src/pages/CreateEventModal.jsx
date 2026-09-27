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
    <Modal isOpen={isOpen} onClose={handleClose} title={createdEvent ? "Event Created Successfully" : "Create New Event"}>
      {createdEvent ? (
        <div className="space-y-6 text-center py-2">
          {/* Success Banner in Block Lime per DESIGN.md */}
          <div className="block-lime rounded-2xl p-6 border border-black/10 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-black text-white flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#D2F46E]" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-black tracking-tight">{createdEvent.name}</h4>
              <p className="caption-mono text-neutral-800 mt-1">
                Share this PIN with your attendees
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-black/15 shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-neutral-500 mb-1">
                Event Access PIN
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-extrabold tracking-[0.2em] text-black">
                  {createdEvent.pin_code}
                </span>
                <button
                  id="btn-copy-pin"
                  onClick={copyPin}
                  title="Copy PIN"
                  className="btn-icon-circle w-9 h-9 border border-[#e5e5e5] hover:border-black"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-black" />}
                </button>
              </div>
              {copied && <span className="text-[11px] text-emerald-700 font-medium mt-1.5 block">Copied to clipboard!</span>}
            </div>
          </div>

          <div className="text-xs text-neutral-600 bg-[#f5f5f7] p-3.5 rounded-xl border border-[#e5e5e5] flex items-center justify-between font-mono">
            <span>Photo Retention Period:</span>
            <span className="font-semibold text-black">{createdEvent.retention_days} days</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleClose}
              className="btn-secondary flex-1 py-2 text-xs"
            >
              Done
            </button>
            <button
              id="btn-goto-created-event"
              onClick={handleViewEvent}
              className="btn-primary flex-1 py-2 text-xs"
            >
              <span>View Event</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="eyebrow-mono block mb-1.5">
              Event Name
            </label>
            <input
              id="input-create-event-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual Design Summit, Team Offsite"
              className="input-figma"
            />
          </div>

          <div>
            <label className="eyebrow-mono block mb-1.5">
              Event Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="input-create-event-date"
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="input-figma pl-10"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="eyebrow-mono">
                Photo Retention Period
              </label>
              <span className="font-mono text-xs font-bold text-black">{retentionDays} Days</span>
            </div>
            <div className="relative flex items-center gap-3 py-1">
              <Clock className="w-4 h-4 text-neutral-500 flex-shrink-0" />
              <input
                id="input-create-event-retention"
                type="range"
                min="1"
                max="180"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full h-1.5 bg-[#e5e5e5] rounded-lg appearance-none cursor-pointer accent-black"
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Photos will automatically be deleted from storage after this duration (max 180 days).
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#f0f0f0]">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              id="btn-create-event-submit"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs py-2 px-5"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
