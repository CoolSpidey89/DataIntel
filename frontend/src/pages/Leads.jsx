import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    urgency: '',
    search: ''
  });

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.urgency) params.append('urgency', filters.urgency);
      
      const response = await axios.get(`/api/leads?${params}`);
      setLeads(response.data.leads);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    const classes = {
      critical: 'badge-critical',
      high: 'badge-high',
      medium: 'badge-medium',
      low: 'badge-low'
    };
    return `badge ${classes[urgency] || 'badge-medium'}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'text-blue-600',
      contacted: 'text-yellow-600',
      qualified: 'text-purple-600',
      won: 'text-green-600',
      lost: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const filteredLeads = leads.filter(lead => {
    if (filters.search) {
      return lead.companyName.toLowerCase().includes(filters.search.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search companies..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input pl-10"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={filters.urgency}
            onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
            className="input"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button className="btn btn-secondary flex items-center gap-2">
            <Filter size={18} />
            More Filters
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Products</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Discovered</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-gray-900">{lead.companyName}</p>
                        <p className="text-sm text-gray-500">{lead.companyDetails?.industry || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {lead.productRecommendations?.slice(0, 2).map((prod, idx) => (
                          <span key={idx} className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                            {prod.product}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${lead.leadScore?.total || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{Math.round(lead.leadScore?.total || 0)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={getUrgencyBadge(lead.urgency)}>
                        {lead.urgency?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-medium capitalize ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDistanceToNow(new Date(lead.metadata?.discoveredAt), { addSuffix: true })}
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        to={`/leads/${lead._id}`}
                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        View <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLeads.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No leads found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
