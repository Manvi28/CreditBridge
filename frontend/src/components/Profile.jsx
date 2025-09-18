import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Profile.css';

const defaultForm = {
  age: '',
  gender: '',
  occupation: '',
  monthlyIncome: ['', '', '', '', '', ''],
  rentPayment: 'on-time',
  utility1Payment: 'on-time',
  utility2Payment: 'on-time',
  educationLevel: '',
  fieldOfStudy: ''
};

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/profile');
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          ...response.data,
          monthlyIncome: response.data.monthlyIncome || prev.monthlyIncome
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value ?? ''
    }));
  };

  const handleIncomeChange = (index, value) => {
    const newIncome = [...formData.monthlyIncome];
    newIncome[index] = value ?? '';
    setFormData(prev => ({
      ...prev,
      monthlyIncome: newIncome
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('http://localhost:5000/api/profile', formData);

      await axios.post('http://localhost:5000/api/score/calculate', formData);

      setSuccess('Profile saved and credit score calculated!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Complete Your Profile</h2>
          <p className="text-gray-600 mb-6">
            Please provide the following information to calculate your credit score
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Profile */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age ?? ''}
                    onChange={handleChange}
                    required
                    min="18"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender ?? ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation ?? ''}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Monthly Income */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Income (Last 6 Months)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {months.map((month, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{month}</label>
                    <input
                      type="number"
                      value={formData.monthlyIncome[index] ?? ''}
                      onChange={(e) => handleIncomeChange(index, e.target.value)}
                      required
                      min="0"
                      placeholder="Amount in $"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment History */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4">Payment History</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['rentPayment','utility1Payment','utility2Payment'].map((field, i) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {['Rent Payment','Utility Payment 1','Utility Payment 2'][i]}
                    </label>
                    <select
                      name={field}
                      value={formData[field] ?? 'on-time'}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="on-time">On Time</option>
                      <option value="late">Late</option>
                      <option value="na">N/A</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4">Education Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel ?? ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select</option>
                    <option value="high-school">High School</option>
                    <option value="bachelors">Bachelor's Degree</option>
                    <option value="masters">Master's Degree</option>
                    <option value="phd">PhD</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                  <input
                    type="text"
                    name="fieldOfStudy"
                    value={formData.fieldOfStudy ?? ''}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">{success}</div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Calculating...' : 'Save & Calculate Score'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
