import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Users, Target, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  const COLORS = ['#4c51bf', '#48bb78', '#ed8936', '#f56565'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalLeads || 0}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Users className="text-primary-600" size={28} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Lead Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{Math.round(stats?.avgLeadScore || 0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.leadsPerWeek?.slice(-1)[0]?.count || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={28} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.leadsByUrgency?.find(u => u._id === 'high' || u._id === 'critical')?.count || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'New', value: stats?.conversionFunnel?.new || 0 },
              { name: 'Contacted', value: stats?.conversionFunnel?.contacted || 0 },
              { name: 'Qualified', value: stats?.conversionFunnel?.qualified || 0 },
              { name: 'Won', value: stats?.conversionFunnel?.won || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4c51bf" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leads by Urgency */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Leads by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.leadsByUrgency || []}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {stats?.leadsByUrgency?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products and Sectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {stats?.topProducts?.slice(0, 5).map((product, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="font-medium">{product._id}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(product.count / stats.topProducts[0].count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{product.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Top Sectors</h3>
          <div className="space-y-3">
            {stats?.topSectors?.slice(0, 5).map((sector, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="font-medium">{sector._id || 'Unknown'}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(sector.count / stats.topSectors[0].count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{sector.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
