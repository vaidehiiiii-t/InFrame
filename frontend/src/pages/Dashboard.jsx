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
  Camera,
  ArrowRight
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Signature Figma Block Lime Hero Poster */}
      <section className="block-lime rounded-3xl p-8 sm:p-12 md:p-14 border border-black/10 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black text-white text-[11px] font-mono tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D2F46E]" />
              <span>PIN VAULT & FACE DELIVERY ACTIVE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.04em] text-black leading-tight">
              Hello, {user?.name || 'Friend'}.
            </h1>

            <p className="text-base sm:text-lg text-black font-normal leading-snug">
              Host a gathering to generate your unique 8-character attendee PIN, or join someone else's gallery instantly with zero app download.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                id="btn-hero-create"
                onClick={onOpenCreateModal}
                className="btn-primary py-3 px-6 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
              <button
                id="btn-hero-join"
                onClick={onOpenJoinModal}
                className="btn-secondary py-3 px-6 text-sm"
              >
                <KeyRound className="w-4 h-4 text-black" />
                <span>Join with PIN</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Tile in Hero */}
          <div className="bg-white rounded-2xl p-6 border border-black/15 shadow-sm min-w-[260px] space-y-4">
            <span className="caption-mono block text-neutral-500">Your Activity Overview</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-2xl font-black tracking-tight text-black">{hostedEvents.length}</span>
                <span className="text-[11px] font-mono block text-neutral-600 uppercase">Hosted</span>
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-black">{joinedEvents.length}</span>
                <span className="text-[11px] font-mono block text-neutral-600 uppercase">Joined</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[#f0f0f0] text-[11px] font-mono text-neutral-500 flex items-center justify-between">
              <span>Security Level</span>
              <span className="font-bold text-black">AES-256 / SHA-256</span>
            </div>
          </div>
        </div>
      </section>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <p className="caption-mono text-neutral-500">Loading your events...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {/* Hosted Events Section */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#e5e5e5] pb-4">
              <div>
                <span className="eyebrow-mono block mb-1">Host Operations</span>
                <h2 className="text-2xl font-bold tracking-tight text-black">Events You Host</h2>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Events you created. Share your 8-character PIN code with your attendees.
                </p>
              </div>
              <span className="self-start sm:self-auto caption-mono px-3 py-1 bg-[#f5f5f7] border border-[#e5e5e5] rounded-full text-black">
                {hostedEvents.length} {hostedEvents.length === 1 ? 'EVENT' : 'EVENTS'}
              </span>
            </div>

            {hostedEvents.length === 0 ? (
              <div className="p-10 text-center rounded-3xl border border-dashed border-[#d4d4d8] bg-[#FFF8EE]">
                <div className="w-12 h-12 mx-auto rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center mb-3">
                  <Camera className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-base font-bold text-black">No hosted events yet</h3>
                <p className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto">
                  Host an event to generate a unique PIN code and start collecting attendee photos.
                </p>
                <button
                  onClick={onOpenCreateModal}
                  className="mt-5 btn-primary text-xs py-2 px-5 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Your First Event</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hostedEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    className="card-hairline hover:border-black flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <h3 className="font-bold text-base text-black group-hover:underline line-clamp-1">
                          {ev.name}
                        </h3>
                        <span className="eyebrow-mono text-[9px] px-2.5 py-0.5 rounded-full bg-black text-white flex-shrink-0">
                          Host
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-neutral-600 font-normal">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{ev.event_date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Expires in {ev.retention_days} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{ev.member_count} {ev.member_count === 1 ? 'Member' : 'Members'}</span>
                        </div>
                      </div>
                    </div>

                    {/* PIN Banner */}
                    <div className="mt-6 pt-4 border-t border-[#f0f0f0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="caption-mono text-neutral-400">PIN:</span>
                        <span className="font-mono text-base font-extrabold tracking-[0.15em] text-black bg-[#f5f5f7] px-2 py-0.5 rounded-md border border-[#e5e5e5]">
                          {ev.pin_code}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleCopyPin(ev.pin_code, e)}
                        title="Copy PIN code"
                        className="btn-icon-circle w-8 h-8 border border-[#e5e5e5] hover:border-black"
                      >
                        {copiedPin === ev.pin_code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-black" />
                        )}
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Joined Events Section */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#e5e5e5] pb-4">
              <div>
                <span className="eyebrow-mono block mb-1">Attendee Access</span>
                <h2 className="text-2xl font-bold tracking-tight text-black">Events You Joined</h2>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Galleries you entered via PIN code.
                </p>
              </div>
              <span className="self-start sm:self-auto caption-mono px-3 py-1 bg-[#f5f5f7] border border-[#e5e5e5] rounded-full text-black">
                {joinedEvents.length} {joinedEvents.length === 1 ? 'EVENT' : 'EVENTS'}
              </span>
            </div>

            {joinedEvents.length === 0 ? (
              <div className="p-10 text-center rounded-3xl border border-dashed border-[#d4d4d8] bg-[#f5f5f7]">
                <div className="w-12 h-12 mx-auto rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center mb-3">
                  <KeyRound className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-base font-bold text-black">Haven't joined any events yet</h3>
                <p className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto">
                  Have an event PIN from an organizer? Enter it to access the shared gallery.
                </p>
                <button
                  onClick={onOpenJoinModal}
                  className="mt-5 btn-secondary text-xs py-2 px-5 inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-black" />
                  <span>Enter an Event PIN</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {joinedEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    className="card-hairline hover:border-black flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <h3 className="font-bold text-base text-black group-hover:underline line-clamp-1">
                          {ev.name}
                        </h3>
                        <span className="eyebrow-mono text-[9px] px-2.5 py-0.5 rounded-full bg-[#f5f5f7] border border-[#e5e5e5] text-black flex-shrink-0">
                          Guest
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-neutral-600 font-normal">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{ev.event_date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{ev.member_count} {ev.member_count === 1 ? 'Member' : 'Members'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#f0f0f0] flex items-center justify-between text-xs font-medium text-black">
                      <span>View Gallery</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Deep Navy Story Block per DESIGN.md: the only dark color block above footer */}
          <section className="block-navy rounded-3xl p-8 sm:p-12 md:p-14 border border-black/10">
            <div className="max-w-3xl space-y-4">
              <span className="eyebrow-mono text-neutral-400 block">HOW EVENTSNAP WORKS</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-white leading-tight">
                Designed for speed, privacy, and zero installation friction.
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed">
                Traditional event sharing forces every guest to download heavy mobile apps or sign up with bulky accounts. EventSnap's dual-access system allows immediate photo access via PIN while indexing faces privately.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-white/10">
              <div className="space-y-2">
                <span className="font-mono text-xs text-[#D2F46E] font-bold">01 / PIN ACCESS</span>
                <h4 className="text-base font-bold text-white">8-Character Entry</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Cryptographically secure PIN codes allow frictionless entry from any phone browser or tablet.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs text-[#E4D4F4] font-bold">02 / FACE REKOGNITION</span>
                <h4 className="text-base font-bold text-white">Isolated Collections</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Each event generates a segregated AWS Rekognition collection for lightning-fast face indexing.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs text-[#B2F1DE] font-bold">03 / LIFECYCLE CONTROLS</span>
                <h4 className="text-base font-bold text-white">Automated Retention</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Organizers select exact expiration dates (1–180 days) for automatic data hygiene and deletion.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
