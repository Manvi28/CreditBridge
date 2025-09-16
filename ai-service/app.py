from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os

app = Flask(__name__)
CORS(app)

# Load model and encoders
model = None
label_encoders = None
feature_names = None

def load_model():
    global model, label_encoders, feature_names
    
    # Train model if not exists
    if not os.path.exists('credit_score_model.pkl'):
        print("Model not found. Training new model...")
        from train_model import train_model
        train_model()
    
    # Load model and encoders
    model = joblib.load('credit_score_model.pkl')
    label_encoders = joblib.load('label_encoders.pkl')
    feature_names = joblib.load('feature_names.pkl')
    print("Model loaded successfully!")

def preprocess_input(data):
    """Preprocess input data for prediction"""
    
    # Calculate average income and stability
    monthly_income = data.get('monthlyIncome', [0] * 6)
    monthly_income = [float(x) if x else 0 for x in monthly_income]
    avg_income = np.mean(monthly_income) if monthly_income else 0
    income_stability = 1 - (np.std(monthly_income) / avg_income if avg_income > 0 else 1)
    
    # Map occupation to category
    occupation_categories = {
        'engineer': 'professional',
        'doctor': 'professional',
        'lawyer': 'professional',
        'teacher': 'professional',
        'software': 'professional',
        'manager': 'professional',
        'analyst': 'skilled',
        'technician': 'skilled',
        'nurse': 'skilled',
        'clerk': 'semi-skilled',
        'sales': 'semi-skilled',
        'assistant': 'entry-level',
        'intern': 'entry-level'
    }
    
    occupation = data.get('occupation', '').lower()
    occupation_type = 'semi-skilled'  # default
    for key, value in occupation_categories.items():
        if key in occupation:
            occupation_type = value
            break
    
    # Map education level
    education_mapping = {
        'other': 0,
        'high-school': 1,
        'bachelors': 2,
        'masters': 3,
        'phd': 4
    }
    education_encoded = education_mapping.get(data.get('educationLevel', 'other'), 0)
    
    # Map occupation type
    occupation_mapping = {
        'entry-level': 0,
        'semi-skilled': 1,
        'skilled': 2,
        'professional': 3
    }
    occupation_encoded = occupation_mapping.get(occupation_type, 1)
    
    # Map payment history
    payment_mapping = {'on-time': 1, 'late': 0, 'na': 0.5}
    rent_payment = payment_mapping.get(data.get('rentPayment', 'on-time'), 1)
    utility1_payment = payment_mapping.get(data.get('utility1Payment', 'on-time'), 1)
    utility2_payment = payment_mapping.get(data.get('utility2Payment', 'on-time'), 1)
    
    # Encode gender
    gender = data.get('gender', 'other')
    if gender in label_encoders['gender'].classes_:
        gender_encoded = label_encoders['gender'].transform([gender])[0]
    else:
        gender_encoded = 0  # default
    
    # Create feature vector
    features = {
        'age': float(data.get('age', 30)),
        'gender_encoded': gender_encoded,
        'education_encoded': education_encoded,
        'occupation_encoded': occupation_encoded,
        'avg_income': avg_income,
        'income_stability': income_stability,
        'income_month_1': monthly_income[0] if len(monthly_income) > 0 else 0,
        'income_month_2': monthly_income[1] if len(monthly_income) > 1 else 0,
        'income_month_3': monthly_income[2] if len(monthly_income) > 2 else 0,
        'income_month_4': monthly_income[3] if len(monthly_income) > 3 else 0,
        'income_month_5': monthly_income[4] if len(monthly_income) > 4 else 0,
        'income_month_6': monthly_income[5] if len(monthly_income) > 5 else 0,
        'rent_payment': rent_payment,
        'utility1_payment': utility1_payment,
        'utility2_payment': utility2_payment
    }
    
    # Create DataFrame with correct column order
    df = pd.DataFrame([features])[feature_names]
    
    return df

def generate_explanation(score, features):
    """Generate explanation for the credit score"""
    
    # Determine risk band
    if score >= 70:
        risk_band = "Low"
        explanation = "You have an excellent credit profile with strong financial indicators."
    elif score >= 40:
        risk_band = "Medium"
        explanation = "Your credit profile shows moderate risk. Consider improving payment consistency and income stability."
    else:
        risk_band = "High"
        explanation = "Your credit profile indicates higher risk. Focus on establishing consistent payment history and stable income."
    
    # Generate top factors
    top_factors = []
    
    # Payment History Factor
    payment_score = (features['rent_payment'].iloc[0] + 
                    features['utility1_payment'].iloc[0] + 
                    features['utility2_payment'].iloc[0]) / 3
    
    if payment_score > 0.8:
        top_factors.append({
            "name": "Payment History",
            "description": "Excellent payment consistency across rent and utilities",
            "impact": "positive",
            "weight": 35
        })
    elif payment_score < 0.5:
        top_factors.append({
            "name": "Payment History",
            "description": "Inconsistent payment history affecting your score",
            "impact": "negative",
            "weight": 35
        })
    else:
        top_factors.append({
            "name": "Payment History",
            "description": "Moderate payment consistency with room for improvement",
            "impact": "neutral",
            "weight": 35
        })
    
    # Income Factor
    avg_income = features['avg_income'].iloc[0]
    if avg_income > 5000:
        top_factors.append({
            "name": "Income Level",
            "description": "Strong income level supporting creditworthiness",
            "impact": "positive",
            "weight": 30
        })
    elif avg_income < 2000:
        top_factors.append({
            "name": "Income Level",
            "description": "Lower income level impacting credit assessment",
            "impact": "negative",
            "weight": 30
        })
    else:
        top_factors.append({
            "name": "Income Level",
            "description": "Moderate income level",
            "impact": "neutral",
            "weight": 30
        })
    
    # Education Factor
    education_level = features['education_encoded'].iloc[0]
    if education_level >= 3:
        top_factors.append({
            "name": "Education",
            "description": "Advanced education positively influences your profile",
            "impact": "positive",
            "weight": 15
        })
    else:
        top_factors.append({
            "name": "Education",
            "description": "Educational background considered in assessment",
            "impact": "neutral",
            "weight": 15
        })
    
    return risk_band, explanation, top_factors

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'AI Service is running'})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Preprocess input
        features = preprocess_input(data)
        
        # Make prediction
        score = model.predict(features)[0]
        score = int(np.clip(score, 0, 100))
        
        # Generate explanation
        risk_band, explanation, top_factors = generate_explanation(score, features)
        
        response = {
            'score': score,
            'riskBand': risk_band,
            'topFactors': top_factors,
            'explanation': explanation
        }
        
        return jsonify(response)
    
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    load_model()
    app.run(host='0.0.0.0', port=6000, debug=True)