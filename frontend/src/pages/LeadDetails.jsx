import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Phone, Mail, MapPin, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function LeadDetails() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactNote, setContactNote] = useState('');

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await axios.get(`/api/leads/${id}`);
      setLead(response.data);
    } catch (error) {
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`/api/leads/${id}`, { status: newStatus });
      setLead({ ...lead, status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAddContact = async (method) => {
    try {
      await axios.post(`/api/leads/${id}/contact`, {
        method,
        outcome: 'attempted',
        notes: contactNote
      });
      toast.success('Contact attempt recorded');
      setContactNote('');
      fetchLead();
    } catch (error) {
      toast.error('Failed to record contact');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (!lead) {
    return <div className="text-center py-12">Lead not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.companyName}</h1>
            <p className="text-gray-600 mt-1">{lead.companyDetails?.industry || 'Industry not specified'}</p>
          </div>
          <div className="flex gap-2">
            <span className={`badge ${
              lead.urgency === 'critical' ? 'badge-critical' :
              lead.urgency === 'high' ? 'badge-high' :
              lead.urgency === 'medium' ? 'badge-medium' : 'badge-low'
            }`}>
              {lead.urgency?.toUpperCase()}
            </span>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="input py-1"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        {/* Lead Score */}
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-700 font-medium">Lead Score</p>
              <p className="text-4xl font-bold text-primary-900 mt-1">
                {Math.round(lead.leadScore?.total || 0)}/100
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-primary-600">Intent</p>
                <p className="font-bold">{Math.round(lead.leadScore?.intentStrength || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-primary-600">Freshness</p>
                <p className="font-bold">{Math.round(lead.leadScore?.freshness || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-primary-600">Size</p>
                <p className="font-bold">{Math.round(lead.leadScore?.companySize || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-primary-600">Proximity</p>
                <p className="font-bold">{Math.round(lead.leadScore?.proximity || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Recommendations */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Recommended Products</h2>
            <div className="space-y-3">
              {lead.productRecommendations?.map((prod, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{prod.product}</h3>
                        <span className="text-sm text-gray-600">({prod.productName})</span>
                      </div>
                      <p className="text-sm text-primary-600 mt-1">{prod.category}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {prod.reasonCodes?.map((reason, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        {Math.round(prod.confidence * 100)}%
                      </p>
                      <p className="text-xs text-gray-500">Confidence</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signals */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Discovered Signals</h2>
            <div className="space-y-3">
              {lead.signals?.map((signal, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-primary-600">{signal.sourceType}</span>
                      <p className="text-xs text-gray-500 mt-1">{signal.source}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(signal.timestamp), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{signal.extractedText?.substring(0, 200)}...</p>
                  {signal.keywords?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {signal.keywords.map((kw, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact History */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Contact History</h2>
            {lead.contactAttempts?.length > 0 ? (
              <div className="space-y-2">
                {lead.contactAttempts.map((contact, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock size={16} className="text-gray-500" />
                    <div className="flex-1">
                      <p className="font-medium">{contact.method} - {contact.outcome}</p>
                      <p className="text-sm text-gray-600">{contact.notes}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(contact.date), 'PPp')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No contact attempts yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button 
                onClick={() => handleAddContact('call')}
                className="w-full btn btn-primary flex items-center justify-center gap-2"
              >
                <Phone size={18} />
                Call Customer
              </button>
              <button className="w-full btn btn-secondary flex items-center justify-center gap-2">
                <Mail size={18} />
                Send Email
              </button>
              <button className="w-full btn btn-secondary flex items-center justify-center gap-2">
                <Calendar size={18} />
                Schedule Meeting
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Add Note</label>
              <textarea
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                className="input"
                rows="3"
                placeholder="Add contact notes..."
              ></textarea>
            </div>
          </div>

          {/* Company Details */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Company Details</h2>
            <div className="space-y-3 text-sm">
              {lead.companyDetails?.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-gray-600">{lead.companyDetails.address}</p>
                  </div>
                </div>
              )}
              {lead.companyDetails?.gst && (
                <div>
                  <p className="font-medium">GST</p>
                  <p className="text-gray-600">{lead.companyDetails.gst}</p>
                </div>
              )}
              {lead.territory && (
                <div>
                  <p className="font-medium">Territory</p>
                  <p className="text-gray-600">{lead.territory}</p>
                </div>
              )}
            </div>
          </div>

          {/* Next Action */}
          <div className="card bg-yellow-50 border-yellow-200">
            <h2 className="text-lg font-semibold mb-2">Next Action</h2>
            <p className="text-sm text-gray-700">{lead.nextAction?.action || 'No action specified'}</p>
            {lead.nextAction?.dueDate && (
              <p className="text-xs text-gray-600 mt-2">
                Due: {format(new Date(lead.nextAction.dueDate), 'PPP')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
