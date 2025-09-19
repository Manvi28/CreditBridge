import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Dashboard.css';
import { FaHome, FaUser, FaMoneyBillWave, FaUniversity, FaCreditCard, FaChartLine } from 'react-icons/fa';

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
  PieChart,
  Pie,
  Cell,
  
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');

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
            className="recalc-btn"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const incomeData = profileData.monthlyIncome?.map((income, index) => ({
    month: `Month ${index + 1}`,
    income: parseFloat(income) || 0
  })) || [];

  const paymentData = [
    { name: 'Rent', status: profileData.rentPayment === 'on-time' ? 100 : 0 },
    { name: 'Utility 1', status: profileData.utility1Payment === 'on-time' ? 100 : 0 },
    { name: 'Utility 2', status: profileData.utility2Payment === 'on-time' ? 100 : 0 }
  ];

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

  const sidebarOptions = [
    { name: 'Dashboard', icon: <FaHome /> },
    { name: 'Profile', icon: <FaUser /> },
    { name: 'Loans', icon: <FaMoneyBillWave /> },
    { name: 'Banking', icon: <FaUniversity /> },
    { name: 'Credit Cards', icon: <FaCreditCard /> },
    { name: 'Investments', icon: <FaChartLine /> },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="profile-name">{user?.name || 'User'}</div>
          <div className={`profile-risk ${getRiskBandColor(scoreData.riskBand)}`}>{scoreData.riskBand}</div>
        </div>

        <div className="sidebar-nav">
          {sidebarOptions.map((option, idx) => (
            <button
              key={idx}
              className={`nav-btn ${activeTab === option.name ? 'active-tab' : ''}`}
              onClick={() => setActiveTab(option.name)}
            >
              {option.icon} {option.name}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="recalc-btn" onClick={handleRecalculate}>Update Profile</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="main-panel">
        {activeTab === 'Dashboard' && (
          <>
            {/* Score Cards */}
            <div className="score-cards">
              <div className="card text-center">
                <div className="score-number text-6xl font-bold {getScoreColor(scoreData.score)}">{scoreData.score}</div>
                <div className="mt-2 text-gray-600">Credit Score</div>
              </div>
              <div className="card text-center">
                <div className={`risk-band ${getRiskBandColor(scoreData.riskBand)}`}>{scoreData.riskBand}</div>
                <div className="mt-2 text-gray-600">Risk Band</div>
              </div>
              <div className="card text-center">
                <div className="text-gray-600">{new Date(scoreData.calculatedAt).toLocaleDateString()}</div>
                <div className="mt-2 text-gray-600">Last Updated</div>
              </div>
            </div>

            {/* Top Factors */}
            <div className="top-factors">
              <h2 className="font-bold mb-3">Top Factors Affecting Your Score</h2>
              {scoreData.topFactors?.map((factor, index) => (
                <div key={index} className="factor-card">
                  <div>{index + 1}. {factor.name}</div>
                  <div className={`factor-impact ${factor.impact === 'positive' ? 'impact-positive' : 'impact-negative'}`}>
                    {factor.impact === 'positive' ? '+' : '-'}{factor.weight}%
                  </div>
                </div>
              )) || <div>No factor data</div>}
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <h3 className="font-bold mb-2">Income Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={incomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Line type="monotone" dataKey="income" stroke="#4F46E5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <h3 className="font-bold mb-2">Payment Consistency</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={paymentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="status" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Other Tabs */}
        {activeTab === 'Profile' && (
  <div className="profile-section">
    <div className="profile-header">
      <img src={profileData.profilePic || '/default-avatar.png'} alt="Profile" className="profile-pic" />
      <h2>{profileData.name}</h2>
      <p>{profileData.email}</p>
    </div>

    <div className="profile-details">
      <div><strong>Phone:</strong> {profileData.phone || '9156789432'}</div>
      <div><strong>Address:</strong> {profileData.address || 'Kolkata, India'}</div>
      <div><strong>Occupation:</strong> {profileData.occupation || '-'}</div>
      <div><strong>Education:</strong> {profileData.education || '-'}</div>
    </div>

    <div className="profile-chart">
      <h3>Monthly Income Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={incomeData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value}`} />
          <Line type="monotone" dataKey="income" stroke="#4F46E5" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

        {activeTab === 'Loans' && (
  <div className="loans-section">
    <h2>My Loans</h2>
    {profileData.loans?.length > 0 ? profileData.loans.map((loan, idx) => (
      <div key={idx} className="loan-card">
        <div><strong>Type:</strong> {loan.type}</div>
        <div><strong>Amount:</strong> ${loan.amount}</div>
        <div><strong>Interest:</strong> {loan.interest}%</div>
        <div><strong>Tenure:</strong> {loan.tenure} months</div>
        <div><strong>Status:</strong> {loan.status}</div>
      </div>
    )) : <p>No loans found</p>}
  </div>
)}

        {activeTab === 'Banking' && (
  <div className="banking-section">
    <h2>Bank Account</h2>
    <div className="bank-info">
      <div><strong>Bank:</strong> {profileData.bankName || '-'}</div>
      <div><strong>Account No:</strong> {profileData.accountNo || '-'}</div>
      <div><strong>Balance:</strong> ${profileData.balance || '0.00'}</div>
    </div>

    <h3>Recent Transactions</h3>
    <table className="transaction-table">
      <thead>
        <tr>
          <th>Date</th><th>Description</th><th>Amount</th><th>Type</th>
        </tr>
      </thead>
      <tbody>
        {profileData.transactions?.map((tx, idx) => (
          <tr key={idx}>
            <td>{tx.date}</td>
            <td>{tx.desc}</td>
            <td>${tx.amount}</td>
            <td>{tx.type}</td>
          </tr>
        )) || <tr><td colSpan="4">No transactions</td></tr>}
      </tbody>
    </table>
  </div>
)}

       {activeTab === 'Credit Cards' && (
  <div className="cards-section">
    <h2>My Credit Cards</h2>
    {profileData.cards?.length > 0 ? profileData.cards.map((card, idx) => (
      <div key={idx} className="card-info">
        <div>{card.type} - {card.number.slice(-4)}</div>
        <div>Limit: ${card.limit}</div>
        <div>Outstanding: ${card.outstanding}</div>
        <div>Due Date: {card.dueDate}</div>
      </div>
    )) : <p>No credit cards found</p>}
  </div>
)}

        {activeTab === 'Investments' && (
  <div className="investments-section">
    <h2>My Investments</h2>
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={profileData.investments} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
          {profileData.investments?.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={['#4F46E5','#10B981','#F59E0B'][idx % 3]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    <table className="transaction-table">
      <thead>
        <tr><th>Asset</th><th>Value</th></tr>
      </thead>
      <tbody>
        {profileData.investments?.map((inv, idx) => (
          <tr key={idx}>
            <td>{inv.name}</td>
            <td>${inv.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

      </div>
    </div>
  );
};

export default Dashboard;
