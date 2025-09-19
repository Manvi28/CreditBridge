import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import { FaHome, FaUser, FaMoneyBillWave, FaUniversity, FaCreditCard, FaChartLine } from 'react-icons/fa';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users');
      setUsers(res.data);
      if(res.data.length > 0) setSelectedUser(res.data[0]);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  if(loading) return <div className="min-h-screen flex items-center justify-center text-2xl text-gray-600">Loading...</div>;
  if(!selectedUser) return <div className="min-h-screen flex items-center justify-center text-2xl text-gray-600">No users found</div>;

  const scoreData = selectedUser.creditScore || {};
  const profileData = selectedUser.profile || {};

  const incomeData = profileData.monthlyIncome?.map((income, idx) => ({
    month: `Month ${idx+1}`,
    income: parseFloat(income) || 0
  })) || [];

  const paymentData = [
    { name: 'Rent', status: profileData.rentPayment === 'on-time' ? 100 : 0 },
    { name: 'Utility 1', status: profileData.utility1Payment === 'on-time' ? 100 : 0 },
    { name: 'Utility 2', status: profileData.utility2Payment === 'on-time' ? 100 : 0 }
  ];

  const getScoreColor = (score) => {
    if(score >= 70) return 'text-green-600';
    if(score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getRiskBandColor = (band) => {
    switch(band?.toLowerCase()){
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
          <h2 className="font-bold text-lg mb-2">Users</h2>
          <div className="user-list">
            {users.map(u => (
              <button
                key={u._id}
                className={`nav-btn ${selectedUser._id === u._id ? 'active-tab' : ''}`}
                onClick={() => {setSelectedUser(u); setActiveTab('Dashboard');}}
              >
                <FaUser /> {u.name}
              </button>
            ))}
          </div>
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
          <button className="logout-btn" onClick={() => navigate('/login')}>Logout</button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="main-panel">
        {/* Dashboard */}
        {activeTab === 'Dashboard' && (
          <>
            <div className="score-cards">
              <div className="card text-center">
                <div className={`score-number ${getScoreColor(scoreData.score)}`}>{scoreData.score || '-'}</div>
                <div className="mt-2 text-gray-600">Credit Score</div>
              </div>
              <div className="card text-center">
                <div className={`risk-band ${getRiskBandColor(scoreData.riskBand)}`}>{scoreData.riskBand || '-'}</div>
                <div className="mt-2 text-gray-600">Risk Band</div>
              </div>
              <div className="card text-center">
                <div className="text-gray-600">{scoreData.calculatedAt ? new Date(scoreData.calculatedAt).toLocaleDateString() : '-'}</div>
                <div className="mt-2 text-gray-600">Last Updated</div>
              </div>
            </div>

            <div className="top-factors">
              <h2 className="font-bold mb-3">Top Factors Affecting Score</h2>
              {scoreData.topFactors?.length > 0 ? scoreData.topFactors.map((f, idx) => (
                <div key={idx} className="factor-card">
                  <div>{idx+1}. {f.name}</div>
                  <div className={`factor-impact ${f.impact==='positive' ? 'impact-positive':'impact-negative'}`}>
                    {f.impact==='positive' ? '+' : '-'}{f.weight}%
                  </div>
                </div>
              )) : <div>No factors</div>}
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3 className="font-bold mb-2">Income Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={incomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={v=>`$${v}`} />
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
                    <YAxis domain={[0,100]} />
                    <Tooltip formatter={v=>`${v}%`} />
                    <Bar dataKey="status" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Profile Tab */}
        {activeTab === 'Profile' && (
          <div className="profile-section">
            <div className="profile-header">
              <h2>{selectedUser.name}</h2>
              <p>{selectedUser.email}</p>
            </div>
            <div className="profile-details">
              <div><strong>Age:</strong> {profileData.age || '-'}</div>
              <div><strong>Gender:</strong> {profileData.gender || '-'}</div>
              <div><strong>Occupation:</strong> {profileData.occupation || '-'}</div>
              <div><strong>Field:</strong> {profileData.fieldOfStudy || '-'}</div>
              <div><strong>Education:</strong> {profileData.educationLevel || '-'}</div>
            </div>
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'Loans' && (
          <div className="loans-section">
            <h2>Loans</h2>
            {profileData.loans?.length > 0 ? profileData.loans.map((loan, idx) => (
              <div key={idx} className="loan-card">
                <div><strong>Type:</strong> {loan.type}</div>
                <div><strong>Amount:</strong> ${loan.amount}</div>
                <div><strong>Interest:</strong> {loan.interest}%</div>
                <div><strong>Tenure:</strong> {loan.tenure} months</div>
                <div><strong>Status:</strong> {loan.status}</div>
              </div>
            )) : <p>No loans</p>}
          </div>
        )}

        {/* Banking Tab */}
        {activeTab === 'Banking' && (
          <div className="banking-section">
            <h2>Bank Account</h2>
            <div className="bank-info">
              <div><strong>Bank:</strong> {profileData.bankName || '-'}</div>
              <div><strong>Account No:</strong> {profileData.accountNo || '-'}</div>
              <div><strong>Balance:</strong> ${profileData.balance || '0.00'}</div>
            </div>
          </div>
        )}

        {/* Credit Cards Tab */}
        {activeTab === 'Credit Cards' && (
          <div className="cards-section">
            <h2>Credit Cards</h2>
            {profileData.cards?.length > 0 ? profileData.cards.map((card, idx) => (
              <div key={idx} className="card-info">
                <div>{card.type} - {card.number.slice(-4)}</div>
                <div>Limit: ${card.limit}</div>
                <div>Outstanding: ${card.outstanding}</div>
                <div>Due Date: {card.dueDate}</div>
              </div>
            )) : <p>No cards</p>}
          </div>
        )}

        {/* Investments Tab */}
        {activeTab === 'Investments' && (
          <div className="investments-section">
            <h2>Investments</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={profileData.investments || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {profileData.investments?.map((inv, idx) => (
                    <Cell key={idx} fill={['#4F46E5','#10B981','#F59E0B'][idx % 3]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
