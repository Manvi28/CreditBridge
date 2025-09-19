# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os

app = Flask(__name__)
CORS(app)

model = None
label_encoders = None
feature_names = None

def load_model():
    global model, label_encoders, feature_names
    if not os.path.exists('credit_score_model.pkl'):
        raise SystemExit("Model not found. Run train_model.py first.")
    model = joblib.load('credit_score_model.pkl')
    label_encoders = joblib.load('label_encoders.pkl')
    feature_names = joblib.load('feature_names.pkl')
    print("✅ Model and encoders loaded.")

def safe_float(x, default=0.0):
    try:
        return float(x)
    except Exception:
        return default

def preprocess_input(data):
    user_type = str(data.get('userType', 'working')).lower()

    # gender encoding
    gender = str(data.get('gender', 'other'))
    gender_enc = 0
    if 'gender' in label_encoders and gender in label_encoders['gender'].classes_:
        gender_enc = int(label_encoders['gender'].transform([gender])[0])

    # education encoding
    edu_map = {'other':0,'high-school':1,'bachelors':2,'masters':3,'phd':4}
    edu_enc = edu_map.get(data.get('educationLevel','other'), 0)

    features = {
        'age': safe_float(data.get('age', 25)),
        'gender_enc': gender_enc,
        'edu_enc': edu_enc
    }

    if user_type == 'working':
        monthly_income = [safe_float(x, 0.0) for x in data.get('monthlyIncome', [0,0,0,0,0,0])]
        avg_income = np.mean(monthly_income) if monthly_income else 0.0
        income_stability = 1 - (np.std(monthly_income) / avg_income if avg_income > 0 else 0)

        pay_map = {'on-time':1.0,'na':0.5,'late':0.0}
        rent = pay_map.get(data.get('rentPayment','on-time'),1.0)
        u1 = pay_map.get(data.get('utility1Payment','on-time'),1.0)
        u2 = pay_map.get(data.get('utility2Payment','on-time'),1.0)

        def occ_cat(occ):
            occ = occ.lower()
            if any(k in occ for k in ['engineer','doctor','lawyer','manager','software']): return 'professional'
            if any(k in occ for k in ['analyst','technician','nurse']): return 'skilled'
            if any(k in occ for k in ['clerk','sales']): return 'semi-skilled'
            return 'entry-level'

        occ_val = occ_cat(str(data.get('occupation','')))
        occ_enc = 0
        if 'occupation_cat' in label_encoders and occ_val in label_encoders['occupation_cat'].classes_:
            occ_enc = int(label_encoders['occupation_cat'].transform([occ_val])[0])

        features.update({
            'occ_enc': occ_enc,
            'avg_income': avg_income,
            'income_stability': income_stability,
            'income_month_1': monthly_income[0] if len(monthly_income)>0 else 0,
            'income_month_2': monthly_income[1] if len(monthly_income)>1 else 0,
            'income_month_3': monthly_income[2] if len(monthly_income)>2 else 0,
            'income_month_4': monthly_income[3] if len(monthly_income)>3 else 0,
            'income_month_5': monthly_income[4] if len(monthly_income)>4 else 0,
            'income_month_6': monthly_income[5] if len(monthly_income)>5 else 0,
            'rentPayment': rent,
            'utility1Payment': u1,
            'utility2Payment': u2,
            'gpa': 0.0,
            'collegeScore': 0.0,
            'cosignerIncome': 0.0,
            'scholarship': 0.0
        })

    else:  # student
        gpa = safe_float(data.get('gpa', 6.5))
        college_score = safe_float(data.get('collegeScore', 60.0))
        cosigner_income = safe_float(data.get('cosignerIncome', 0.0))
        scholarship = 1.0 if str(data.get('scholarship','no')).lower() in ['yes','1','true'] else 0.0
        monthly_income = [safe_float(x, 0.0) for x in data.get('monthlyIncome', [0,0,0,0,0,0])]
        avg_income = np.mean(monthly_income) if monthly_income else 0.0
        income_stability = 1 - (np.std(monthly_income) / avg_income if avg_income > 0 else 0)

        pay_map = {'on-time':1.0,'na':0.5,'late':0.0}
        rent = pay_map.get(data.get('rentPayment','na'),0.5)
        u1 = pay_map.get(data.get('utility1Payment','na'),0.5)
        u2 = pay_map.get(data.get('utility2Payment','na'),0.5)

        occ_enc = 0  # default for students

        features.update({
            'occ_enc': occ_enc,
            'avg_income': avg_income,
            'income_stability': income_stability,
            'income_month_1': monthly_income[0] if len(monthly_income)>0 else 0,
            'income_month_2': monthly_income[1] if len(monthly_income)>1 else 0,
            'income_month_3': monthly_income[2] if len(monthly_income)>2 else 0,
            'income_month_4': monthly_income[3] if len(monthly_income)>3 else 0,
            'income_month_5': monthly_income[4] if len(monthly_income)>4 else 0,
            'income_month_6': monthly_income[5] if len(monthly_income)>5 else 0,
            'rentPayment': rent,
            'utility1Payment': u1,
            'utility2Payment': u2,
            'gpa': gpa,
            'collegeScore': college_score,
            'cosignerIncome': cosigner_income,
            'scholarship': scholarship
        })

    return pd.DataFrame([features])[feature_names]

def generate_explanation(score, features):
    if score >= 70:
        risk_band = "Low"
        explanation = "You have an excellent credit profile."
    elif score >= 40:
        risk_band = "Medium"
        explanation = "Your credit profile shows moderate risk."
    else:
        risk_band = "High"
        explanation = "Your credit profile indicates higher risk."

    top_factors = []
    payment_score = (
        features['rentPayment'].iloc[0] +
        features['utility1Payment'].iloc[0] +
        features['utility2Payment'].iloc[0]
    ) / 3

    gpa = features['gpa'].iloc[0]
    if gpa > 0:
        if gpa >= 8.5:
            top_factors.append({"name":"GPA","description":"Strong academic record","impact":"positive","weight":30})
        elif gpa < 6:
            top_factors.append({"name":"GPA","description":"Low GPA; academic risk","impact":"negative","weight":30})
        else:
            top_factors.append({"name":"GPA","description":"Moderate academic performance","impact":"neutral","weight":30})

    if payment_score > 0.8:
        top_factors.append({"name":"Payment History","description":"Excellent payment consistency","impact":"positive","weight":30})
    elif payment_score < 0.5:
        top_factors.append({"name":"Payment History","description":"Inconsistent payments","impact":"negative","weight":30})
    else:
        top_factors.append({"name":"Payment History","description":"Moderate payment behavior","impact":"neutral","weight":30})

    avg_income = features['avg_income'].iloc[0]
    cosigner = features['cosignerIncome'].iloc[0]
    if avg_income > 5000 or cosigner > 20000:
        top_factors.append({"name":"Support / Income","description":"Stable income or cosigner support","impact":"positive","weight":20})
    else:
        top_factors.append({"name":"Support / Income","description":"Low income or no co-signer","impact":"negative","weight":20})

    return risk_band, explanation, top_factors

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status':'healthy'})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        features = preprocess_input(data)
        score = model.predict(features)[0]
        score = int(np.clip(score, 0, 100))
        risk_band, explanation, top_factors = generate_explanation(score, features)
        return jsonify({
            'score': score,
            'riskBand': risk_band,
            'topFactors': top_factors,
            'explanation': explanation
        })
    except Exception as e:
        print("Prediction error:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    load_model()
    app.run(host='0.0.0.0', port=6000, debug=True)
