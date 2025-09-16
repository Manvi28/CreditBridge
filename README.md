# CreditBridge - AI-Powered Financial Inclusion Platform

CreditBridge is a full-stack web application that provides credit scores to users who have no formal credit history using AI-powered analysis of alternative data.

## Features

- **User Registration & Authentication**: Secure user accounts with JWT authentication
- **Profile Data Collection**: Comprehensive form to collect user financial data
- **AI-Powered Credit Scoring**: Machine learning model that analyzes:
  - Monthly income trends (last 6 months)
  - Payment history (rent and utilities)
  - Education background
  - Occupation and demographics
- **Interactive Dashboard**: Visual representation of:
  - Credit score (0-100)
  - Risk band classification (Low/Medium/High)
  - Income trend graphs
  - Payment consistency charts
  - Top factors affecting the score

## Tech Stack

### Frontend
- React with Vite
- Tailwind CSS for styling
- Recharts for data visualization
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- MongoDB for data storage
- JWT for authentication
- Bcrypt for password hashing

### AI Service
- Python with Flask
- Scikit-learn for machine learning
- Random Forest model for credit scoring
- Pandas and NumPy for data processing

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB (running locally or cloud instance)

## Installation & Setup

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Python Dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

### 4. Generate Training Data and Train Model

```bash
cd ai-service
python generate_data.py
python train_model.py
```

## Running the Application

You need to run all three services:

### 1. Start MongoDB
Make sure MongoDB is running on your system. By default, it should be running on `mongodb://localhost:27017`

### 2. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will run on http://localhost:5000

### 3. Start the AI Service

```bash
cd ai-service
python app.py
```

The AI service will run on http://localhost:6000

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on http://localhost:5173

## Usage

1. **Register**: Create a new account with your email and password
2. **Complete Profile**: Fill in your financial information:
   - Basic details (age, gender, occupation)
   - Monthly income for the last 6 months
   - Payment history for rent and utilities
   - Education details
3. **Get Your Score**: Click "Save & Calculate Score" to get your AI-generated credit score
4. **View Dashboard**: See your credit score, risk band, and detailed analytics

## How the Scoring Works

The AI model considers multiple factors with the following weights:

- **Payment History (35%)**: On-time payments for rent and utilities
- **Income Stability (30%)**: Average income and consistency over 6 months
- **Education Level (15%)**: Higher education correlates with financial literacy
- **Occupation (10%)**: Professional category and stability
- **Demographics (10%)**: Age and other factors

## Project Structure

```
creditbridge/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── context/    # Authentication context
│   │   └── App.jsx     # Main app component
│   └── package.json
├── backend/            # Node.js backend API
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── middleware/     # Authentication middleware
│   └── server.js       # Express server
└── ai-service/         # Python ML service
    ├── app.py          # Flask API
    ├── train_model.py  # Model training script
    └── generate_data.py # Synthetic data generator
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/creditbridge
JWT_SECRET=your-secret-key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Profile
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Update user profile

### Credit Score
- `GET /api/score` - Get credit score
- `POST /api/score/calculate` - Calculate new credit score

### AI Service
- `POST /predict` - Get AI prediction for credit score

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- CORS is configured for local development
- Change JWT_SECRET in production

## Future Enhancements

- Add more sophisticated ML models
- Include more data sources (bank statements, mobile money)
- Add credit improvement recommendations
- Implement real-time notifications
- Add admin dashboard for monitoring

## License

MIT

## Author

CreditBridge Team