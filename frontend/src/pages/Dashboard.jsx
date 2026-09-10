import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Clock, 
  KeyRound, 
  Plus, 
  Copy, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  Camera
} from 'lucide-react';
import { eventsApi } from '../api/events';
import { useAuth } from '../context/AuthContext';

export const Dashboard = ({ onOpenCreateModal, onOpenJoinModal }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedPin, setCopiedPin] = useState(null);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await eventsApi.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCopyPin = (pin, e) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  const hostedEvents = events.filter((ev) => ev.is_host);
  const joinedEvents = events.filter((ev) => !ev.is_host);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Welcome & Quick Action Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-10 border border-white/10 bg-gradient-to-br from-slate-900/90 via-purple-950/20 to-slate-900/90">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Milestone 1 — Event & PIN Access Ready</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Hello, <span className="gradient-text">{user?.name || 'Friend'}</span>!
            </h1>
            <p className="text-sm text-slate-300">
              Create a new event and share the unique 8-character PIN with your attendees, or enter a PIN to join someone else's gathering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-hero-create"
              onClick={onOpenCreateModal}
              className="px-5 py-3 rounded-xl gradient-btn text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
            <button
              id="btn-hero-join"
              onClick={onOpenJoinModal}
              className="px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-md"
            >
              <KeyRound className="w-4 h-4 text-brand-400" />
              <span>Join with PIN</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading your events...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Hosted Events Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Events You Host</h2>
                  <p className="text-xs text-slate-400">Events you created. Share your event PIN with guests.</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800/80 rounded-full text-slate-300 border border-slate-700">
                {hostedEvents.length} {hostedEvents.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            {hostedEvents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
                <Camera className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-300">No hosted events yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Host an event to generate a unique PIN and start gathering attendee photos.
                </p>
                <button
                  onClick={onOpenCreateModal}
                  className="mt-4 px-4 py-2 rounded-lg gradient-btn text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Your First Event</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {hostedEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    className="glass-card rounded-2xl p-5 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold text-base text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                          {ev.name}
                        </h3>
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex-shrink-0">
                          Host
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ev.event_date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Expires in {ev.retention_days} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ev.member_count} {ev.member_count === 1 ? 'Member' : 'Members'}</span>
                        </div>
                      </div>
                    </div>

                    {/* PIN Banner */}
                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                          PIN:
                        </span>
                        <span className="font-mono text-base font-bold text-brand-300 tracking-widest">
                          {ev.pin_code}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleCopyPin(ev.pin_code, e)}
                        title="Copy PIN code"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-brand-500/20 text-slate-400 hover:text-brand-300 transition-colors border border-slate-700/60"
                      >
                        {copiedPin === ev.pin_code ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Joined Events Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Events You Joined</h2>
                  <p className="text-xs text-slate-400">Events you entered via PIN code.</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800/80 rounded-full text-slate-300 border border-slate-700">
                {joinedEvents.length} {joinedEvents.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            {joinedEvents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
                <KeyRound className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-300">Haven't joined any events yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Have an event PIN from a host? Join now to access the event gallery.
                </p>
                <button
                  onClick={onOpenJoinModal}
                  className="mt-4 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-brand-400" />
                  <span>Enter an Event PIN</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {joinedEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    className="glass-card rounded-2xl p-5 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {ev.name}
                        </h3>
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex-shrink-0">
                          Guest
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ev.event_date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ev.member_count} {ev.member_count === 1 ? 'Member' : 'Members'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-brand-400 font-semibold">
                      <span>View Gallery</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
