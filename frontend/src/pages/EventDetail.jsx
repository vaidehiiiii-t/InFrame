import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  KeyRound, 
  Users, 
  Copy, 
  Check, 
  Trash2, 
  ArrowLeft, 
  ShieldCheck, 
  Camera, 
  AlertCircle,
  Database,
  Sparkles
} from 'lucide-react';
import { eventsApi } from '../api/events';
import { useAuth } from '../context/AuthContext';

export const EventDetail = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedPin, setCopiedPin] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'members'

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const eventData = await eventsApi.getEventDetail(eventId);
      setEvent(eventData);

      const membersData = await eventsApi.getEventMembers(eventId);
      setMembers(membersData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load event information.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const handleCopyPin = () => {
    if (event?.pin_code) {
      navigator.clipboard.writeText(event.pin_code);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to revoke this guest access?')) return;
    try {
      await eventsApi.removeMember(eventId, userId);
      setMembers(members.filter((m) => m.user_id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove member.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <p className="caption-mono text-neutral-500">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card-hairline p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-red-600" />
          <h2 className="text-xl font-bold text-black tracking-tight">Unable to Load Event</h2>
          <p className="text-xs text-neutral-600">{error || 'Event does not exist or you lack access.'}</p>
          <Link
            to="/"
            className="btn-secondary text-xs py-2 px-5 inline-flex items-center gap-2 mt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const isHost = event.is_host || event.host_id === user?.id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="btn-secondary text-xs py-1.5 px-4 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Signature Figma Color Block Header Panel */}
      <section className={`${isHost ? 'block-lime' : 'block-lilac'} rounded-3xl p-8 sm:p-12 border border-black/10 transition-all`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`eyebrow-mono text-[9px] px-3 py-1 rounded-full ${
                isHost ? 'bg-black text-white' : 'bg-white text-black border border-black/15'
              }`}>
                {isHost ? 'ORGANIZER / HOST' : 'ATTENDEE / GUEST'}
              </span>
              <span className="caption-mono text-neutral-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {event.event_date}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-black leading-tight">
              {event.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-800 font-mono pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-black" />
                <span>EXPIRES IN {event.retention_days} DAYS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-black" />
                <span>{members.length} {members.length === 1 ? 'ATTENDEE' : 'ATTENDEES'}</span>
              </div>
            </div>
          </div>

          {/* PIN Card for Host or Member */}
          <div className="bg-white rounded-2xl p-5 border border-black/15 shadow-sm flex flex-col items-center justify-center min-w-[240px]">
            <div className="eyebrow-mono text-[9px] text-neutral-500 mb-1 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-black" />
              <span>EVENT ACCESS PIN</span>
            </div>
            <div className="flex items-center gap-3 my-1">
              <span className="font-mono text-3xl font-black text-black tracking-[0.2em]">
                {event.pin_code}
              </span>
              <button
                id="btn-event-copy-pin"
                onClick={handleCopyPin}
                title="Copy PIN"
                className="btn-icon-circle w-9 h-9 border border-[#e5e5e5] hover:border-black"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-black" />}
              </button>
            </div>
            <span className="caption-mono text-[10px] text-neutral-500">
              {copiedPin ? 'COPIED TO CLIPBOARD' : 'SHARE WITH GUESTS'}
            </span>
          </div>
        </div>
      </section>

      {/* Figma Pill Toggle Tabs per DESIGN.md (pricing-tab-default & pricing-tab-selected) */}
      <div className="inline-flex p-1 bg-[#f5f5f7] border border-[#e5e5e5] rounded-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-black text-white shadow-sm'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          Event Overview
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'members'
              ? 'bg-black text-white shadow-sm'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <span>Members</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'members' ? 'bg-white/20 text-white' : 'bg-white text-black border border-[#e5e5e5]'
          }`}>
            {members.length}
          </span>
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Milestone 2 Readiness Info Box */}
          <div className="block-cream p-6 sm:p-8 rounded-3xl border border-black/10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-[#FFF8EE]" />
            </div>
            <div className="space-y-1 text-center md:text-left flex-1">
              <h4 className="text-base font-bold text-black tracking-tight">
                Milestone 1 Active: Auth, Event Creation & PIN Flow Complete!
              </h4>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                You have successfully joined/created this event using EventSnap's secure PIN architecture. 
                In <strong className="font-semibold text-black">Milestone 2</strong>, photo upload directly to AWS S3 and interactive Rekognition face delivery will be activated in this gallery.
              </p>
            </div>
          </div>

          {/* Quick Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="card-hairline p-5 space-y-1">
              <span className="caption-mono block text-neutral-500">Host Organizer</span>
              <div className="text-sm font-bold text-black flex items-center gap-2 pt-1">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>{event.host?.name || 'Organizer'}</span>
              </div>
            </div>

            <div className="card-hairline p-5 space-y-1">
              <span className="caption-mono block text-neutral-500">AWS Rekognition Collection</span>
              <div className="text-xs font-mono font-bold text-black truncate pt-1" title={event.rekognition_collection_id}>
                {event.rekognition_collection_id}
              </div>
            </div>

            <div className="card-hairline p-5 space-y-1">
              <span className="caption-mono block text-neutral-500">Auto-Deletion Expiry</span>
              <div className="text-xs font-mono font-bold text-black pt-1">
                {new Date(event.expires_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Members */}
      {activeTab === 'members' && (
        <div className="card-hairline p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4">
            <div>
              <span className="eyebrow-mono block">Roster</span>
              <h3 className="text-lg font-bold text-black tracking-tight">Event Attendees ({members.length})</h3>
            </div>
            <span className="caption-mono px-3 py-1 bg-[#f5f5f7] border border-[#e5e5e5] rounded-full text-black">
              JOINED VIA PIN
            </span>
          </div>

          <div className="divide-y divide-[#f0f0f0]">
            {members.map((member) => {
              const isMemberHost = member.user_id === event.host_id;
              return (
                <div key={member.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#f5f5f7] border border-[#e5e5e5] flex items-center justify-center text-xs font-bold text-black">
                      {member.user?.name ? member.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-black flex items-center gap-2">
                        <span>{member.user?.name || 'Member'}</span>
                        {isMemberHost && (
                          <span className="eyebrow-mono text-[8px] px-2 py-0.5 rounded-full bg-black text-white">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="caption-mono text-[10px] text-neutral-500 mt-0.5">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Host can revoke access */}
                  {isHost && !isMemberHost && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      title="Revoke guest access"
                      className="btn-icon-circle w-8 h-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
