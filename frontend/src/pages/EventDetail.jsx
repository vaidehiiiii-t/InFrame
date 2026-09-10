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
  AlertCircle 
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
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8 rounded-2xl border border-red-500/20">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Unable to Load Event</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Event does not exist or you lack access.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const isHost = event.is_host || event.host_id === user?.id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                isHost 
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/30' 
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                {isHost ? 'Event Host' : 'Event Guest'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {event.event_date}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {event.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Expires in {event.retention_days} days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>{members.length} {members.length === 1 ? 'Attendee' : 'Attendees'}</span>
              </div>
            </div>
          </div>

          {/* PIN Card for Host or Member */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-brand-500/30 flex flex-col items-center justify-center min-w-[220px]">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-brand-400" />
              <span>Event Join PIN</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-black text-brand-300 tracking-widest">
                {event.pin_code}
              </span>
              <button
                id="btn-event-copy-pin"
                onClick={handleCopyPin}
                title="Copy PIN"
                className="p-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 transition-colors"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              {copiedPin ? 'Copied!' : 'Share with attendees'}
            </span>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'overview'
              ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Event Overview
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'members'
              ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Members</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold">
            {members.length}
          </span>
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Milestone 2 Readiness Info Box */}
          <div className="glass-card p-6 rounded-2xl border border-dashed border-brand-500/30 flex flex-col md:flex-row items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-center md:text-left flex-1">
              <h4 className="text-sm font-bold text-white">
                Milestone 1 Active: Auth, Event Creation & PIN Flow Complete!
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                You have successfully joined/created this event using EventSnap's secure PIN architecture. 
                In <strong className="text-slate-200">Milestone 2</strong>, photo upload directly to AWS S3 and the interactive full event gallery will be added here.
              </p>
            </div>
          </div>

          {/* Quick Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-4 rounded-xl">
              <div className="text-[11px] font-medium text-slate-400 mb-1">Host Organizer</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>{event.host?.name || 'Organizer'}</span>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <div className="text-[11px] font-medium text-slate-400 mb-1">AWS Collection ID</div>
              <div className="text-xs font-mono font-bold text-slate-300 truncate" title={event.rekognition_collection_id}>
                {event.rekognition_collection_id}
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <div className="text-[11px] font-medium text-slate-400 mb-1">Auto-Deletion Expiry</div>
              <div className="text-xs font-bold text-amber-300">
                {new Date(event.expires_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Members */}
      {activeTab === 'members' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Event Attendees ({members.length})</h3>
            <span className="text-xs text-slate-400">Joined via PIN</span>
          </div>

          <div className="divide-y divide-white/5">
            {members.map((member) => {
              const isMemberHost = member.user_id === event.host_id;
              return (
                <div key={member.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                      {member.user?.name ? member.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>{member.user?.name || 'Member'}</span>
                        {isMemberHost && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold uppercase">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Host can revoke access (Acceptance Criteria User Story 2) */}
                  {isHost && !isMemberHost && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      title="Revoke guest access"
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
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
