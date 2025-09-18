import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Dashboard.css';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scoreResponse, profileResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/score'),
        axios.get('http://localhost:5000/api/profile')
      ]);
      
      setScoreData(scoreResponse.data);
      setProfileData(profileResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 404) {
        navigate('/profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRecalculate = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!scoreData || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Credit Score Available</h2>
          <p className="text-gray-600 mb-4">Please complete your profile to calculate your credit score</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for income trend chart
  const incomeData = profileData.monthlyIncome?.map((income, index) => ({
    month: `Month ${index + 1}`,
    income: parseFloat(income) || 0
  })) || [];

  // Prepare data for payment consistency
  const paymentData = [
    { name: 'Rent', status: profileData.rentPayment === 'on-time' ? 100 : 0 },
    { name: 'Utility 1', status: profileData.utility1Payment === 'on-time' ? 100 : 0 },
    { name: 'Utility 2', status: profileData.utility2Payment === 'on-time' ? 100 : 0 }
  ];

  // Get score color based on risk band
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBandColor = (band) => {
    switch(band?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Pie chart colors
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">CreditBridge Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.name || 'User'}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credit Score Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Credit Score</h2>
              <div className={`text-6xl font-bold ${getScoreColor(scoreData.score)}`}>
                {scoreData.score}
              </div>
              <div className="text-sm text-gray-500 mt-2">Out of 100</div>
            </div>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Risk Band</h2>
              <div className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${getRiskBandColor(scoreData.riskBand)}`}>
                {scoreData.riskBand}
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Last Updated</h2>
              <div className="text-gray-600">
                {new Date(scoreData.calculatedAt).toLocaleDateString()}
              </div>
              <button
                onClick={handleRecalculate}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>

        {/* Key Factors */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Top Factors Affecting Your Score</h2>
          <div className="space-y-3">
            {scoreData.topFactors?.map((factor, index) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-semibold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{factor.name}</div>
                  <div className="text-sm text-gray-600">{factor.description}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  factor.impact === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {factor.impact === 'positive' ? '+' : '-'}{factor.weight}%
                </div>
              </div>
            )) || (
              <div className="text-gray-500">No factor data available</div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income Trend */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Income Trend (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Consistency */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Payment Consistency</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar 
                  dataKey="status" 
                  fill="#10B981"
                  name="On-Time Payment %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">How Your Score Was Calculated</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="mb-3">
              Your CreditBridge score is calculated using advanced AI algorithms that analyze multiple factors:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Income Stability (30%):</strong> We analyze your income trends over the past 6 months to assess financial stability.</li>
              <li><strong>Payment History (35%):</strong> Your rent and utility payment patterns show your reliability in meeting obligations.</li>
              <li><strong>Education Level (15%):</strong> Higher education often correlates with better financial management skills.</li>
              <li><strong>Occupation (10%):</strong> Your profession provides context about income potential and stability.</li>
              <li><strong>Age & Demographics (10%):</strong> These factors help contextualize your financial profile.</li>
            </ul>
            <p className="mt-4">
              {scoreData.explanation || 'Your score reflects a comprehensive analysis of your financial behavior and potential.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;