// Module: Meetings
import React, { useState } from 'react';
import { Plus, Clock, MapPin, Users, CheckCircle2, Eye } from 'lucide-react';
import { meetings } from '../../data/mockData';
import { Meeting } from '../../types';

export function Meetings() {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const now = new Date();
  const upcoming = meetings.filter(m => new Date(m.date) >= now);
  const past = meetings.filter(m => new Date(m.date) < now);
  const displayMeetings = showPast ? past : upcoming;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Meetings</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-4">
        <button
          onClick={() => setShowPast(false)}
          className={`px-4 py-2 font-medium transition ${
            !showPast
              ? 'border-b-2 border-blue-600 text-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setShowPast(true)}
          className={`px-4 py-2 font-medium transition ${
            showPast
              ? 'border-b-2 border-blue-600 text-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Past ({past.length})
        </button>
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayMeetings.map(meeting => (
          <div
            key={meeting.id}
            onClick={() => { setSelectedMeeting(meeting); setShowModal(true); }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 cursor-pointer transition"
          >
            <h3 className="text-lg font-bold text-white mb-1">{meeting.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{meeting.project}</p>

            <div className="space-y-3 text-sm text-gray-300 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>{new Date(meeting.date).toLocaleDateString()} at {meeting.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <span>{meeting.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>{meeting.attendees.length} attendees</span>
              </div>
            </div>

            <button className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm font-medium flex items-center justify-center gap-1">
              <Eye className="w-4 h-4" />
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedMeeting.title}</h2>
                <p className="text-gray-400 mt-1">{selectedMeeting.project}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="space-y-6">
              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Date & Time</p>
                  <p className="text-white font-semibold">{new Date(selectedMeeting.date).toLocaleDateString()} • {selectedMeeting.time}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Location</p>
                  <p className="text-white font-semibold">{selectedMeeting.location}</p>
                </div>
              </div>

              {/* Attendees */}
              <div className="border-t border-gray-800 pt-4">
                <h3 className="font-bold text-white mb-3">Attendees ({selectedMeeting.attendees.length})</h3>
                <div className="space-y-2">
                  {selectedMeeting.attendees.map((attendee, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold">
                        {attendee.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{attendee}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agenda */}
              <div className="border-t border-gray-800 pt-4">
                <h3 className="font-bold text-white mb-3">Agenda</h3>
                <ul className="space-y-2">
                  {selectedMeeting.agenda.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              {selectedMeeting.actionItems.length > 0 && (
                <div className="border-t border-gray-800 pt-4">
                  <h3 className="font-bold text-white mb-3">Action Items</h3>
                  <div className="space-y-2">
                    {selectedMeeting.actionItems.map((item, idx) => (
                      <div key={idx} className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-medium">{item.task}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'open' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">Owner: {item.owner} • Due: {new Date(item.due).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setShowModal(false)} className="w-full mt-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
