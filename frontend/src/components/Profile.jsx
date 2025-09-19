import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Profile.css';

const defaultForm = {
  userType: 'working',
  age: '',
  gender: '',
  occupation: '',
  monthlyIncome: ['', '', '', '', '', ''],
  rentPayment: 'on-time',
  utility1Payment: 'on-time',
  utility2Payment: 'on-time',
  educationLevel: '',
  fieldOfStudy: '',
  gpa: '',
  collegeScore: '',
  cosignerIncome: '',
  scholarship: false
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const months = ['Month 1','Month 2','Month 3','Month 4','Month 5','Month 6'];

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h2>Complete Your Profile</h2>
        <p>Please provide the following information to calculate your credit score</p>

        <form onSubmit={handleSubmit} className="profile-form">

          {/* User Type */}
          <div className="form-section">
            <label>User Type</label>
            <select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
            >
              <option value="working">Working</option>
              <option value="student">Student</option>
            </select>
          </div>

          {/* Basic Info */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div>
                <label>Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} required min="18" max="100"/>
              </div>
              <div>
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {formData.userType === 'working' && (
                <div>
                  <label>Occupation</label>
                  <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} placeholder="e.g. Software Engineer"/>
                </div>
              )}
            </div>
          </div>

          {/* Working Fields */}
          {formData.userType === 'working' && (
            <>
              <div className="form-section">
                <h3>Monthly Income (Last 6 Months)</h3>
                <div className="form-grid">
                  {months.map((m, i) => (
                    <div key={i}>
                      <label>{m}</label>
                      <input type="number" value={formData.monthlyIncome[i]} onChange={(e)=>handleIncomeChange(i,e.target.value)} min="0"/>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Payment History</h3>
                <div className="form-grid">
                  {['rentPayment','utility1Payment','utility2Payment'].map((f,i)=>(
                    <div key={f}>
                      <label>{['Rent Payment','Utility 1','Utility 2'][i]}</label>
                      <select name={f} value={formData[f]} onChange={handleChange}>
                        <option value="on-time">On Time</option>
                        <option value="late">Late</option>
                        <option value="na">N/A</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Student Fields */}
          {formData.userType === 'student' && (
            <div className="form-section">
              <h3>Student Information</h3>
              <div className="form-grid">
                <div>
                  <label>GPA</label>
                  <input type="number" step="0.01" name="gpa" value={formData.gpa} onChange={handleChange}/>
                </div>
                <div>
                  <label>College Score</label>
                  <input type="number" name="collegeScore" value={formData.collegeScore} onChange={handleChange}/>
                </div>
                <div>
                  <label>Cosigner Income</label>
                  <input type="number" name="cosignerIncome" value={formData.cosignerIncome} onChange={handleChange}/>
                </div>
                <div className="checkbox-field">
                  <input type="checkbox" name="scholarship" checked={formData.scholarship} onChange={handleChange}/>
                  <label>Has Scholarship</label>
                </div>
              </div>
            </div>
          )}

          {/* Education */}
          <div className="form-section">
            <h3>Education</h3>
            <div className="form-grid">
              <div>
                <label>Education Level</label>
                <select name="educationLevel" value={formData.educationLevel} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="high-school">High School</option>
                  <option value="bachelors">Bachelor's</option>
                  <option value="masters">Master's</option>
                  <option value="phd">PhD</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label>Field of Study</label>
                <input type="text" name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleChange}/>
              </div>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Calculating...' : 'Save & Calculate Score'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
