import pandas as pd
import numpy as np
import random

def generate_synthetic_data(n_samples=5000):
    """Generate synthetic credit scoring data"""
    
    data = []
    
    for _ in range(n_samples):
        # Age (18-70)
        age = random.randint(18, 70)
        
        # Gender
        gender = random.choice(['male', 'female', 'other'])
        
        # Education Level
        education_level = random.choice(['high-school', 'bachelors', 'masters', 'phd', 'other'])
        education_score = {
            'phd': 4,
            'masters': 3,
            'bachelors': 2,
            'high-school': 1,
            'other': 0
        }[education_level]
        
        # Occupation (simplified categories)
        occupation_categories = {
            'professional': 3,
            'skilled': 2,
            'semi-skilled': 1,
            'entry-level': 0
        }
        occupation_type = random.choice(list(occupation_categories.keys()))
        occupation_score = occupation_categories[occupation_type]
        
        # Monthly Income (last 6 months)
        base_income = random.uniform(1000, 10000)
        income_variation = random.uniform(0.8, 1.2)
        monthly_income = [
            base_income * random.uniform(0.9, 1.1) * income_variation 
            for _ in range(6)
        ]
        avg_income = np.mean(monthly_income)
        income_stability = 1 - (np.std(monthly_income) / avg_income if avg_income > 0 else 1)
        
        # Payment History
        payment_reliability = random.uniform(0, 1)
        rent_payment = 1 if payment_reliability > 0.3 else 0  # 1 = on-time, 0 = late
        utility1_payment = 1 if payment_reliability > 0.25 else 0
        utility2_payment = 1 if payment_reliability > 0.25 else 0
        
        # Calculate synthetic credit score (0-100)
        # Weighted scoring formula
        score = 0
        
        # Age factor (5%)
        age_factor = min(1, (age - 18) / 30) * 5
        score += age_factor
        
        # Education factor (15%)
        education_factor = (education_score / 4) * 15
        score += education_factor
        
        # Occupation factor (10%)
        occupation_factor = (occupation_score / 3) * 10
        score += occupation_factor
        
        # Income factor (30%)
        income_factor = min(1, avg_income / 8000) * 30
        score += income_factor
        
        # Income stability factor (10%)
        stability_factor = income_stability * 10
        score += stability_factor
        
        # Payment history factor (30%)
        payment_factor = ((rent_payment + utility1_payment + utility2_payment) / 3) * 30
        score += payment_factor
        
        # Add some random noise
        score += random.uniform(-5, 5)
        
        # Ensure score is within bounds
        score = max(0, min(100, score))
        
        # Create record
        record = {
            'age': age,
            'gender': gender,
            'education_level': education_level,
            'occupation_type': occupation_type,
            'avg_income': avg_income,
            'income_stability': income_stability,
            'income_month_1': monthly_income[0],
            'income_month_2': monthly_income[1],
            'income_month_3': monthly_income[2],
            'income_month_4': monthly_income[3],
            'income_month_5': monthly_income[4],
            'income_month_6': monthly_income[5],
            'rent_payment': rent_payment,
            'utility1_payment': utility1_payment,
            'utility2_payment': utility2_payment,
            'credit_score': round(score)
        }
        
        data.append(record)
    
    return pd.DataFrame(data)

if __name__ == "__main__":
    # Generate synthetic data
    df = generate_synthetic_data(5000)
    
    # Save to CSV
    df.to_csv('synthetic_credit_data.csv', index=False)
    
    print("Synthetic data generated successfully!")
    print(f"Shape: {df.shape}")
    print(f"\nFirst few rows:")
    print(df.head())
    print(f"\nCredit score statistics:")
    print(df['credit_score'].describe())
    print(f"\nDistribution of risk bands:")
    df['risk_band'] = pd.cut(df['credit_score'], 
                             bins=[0, 40, 70, 100], 
                             labels=['High', 'Medium', 'Low'])
    print(df['risk_band'].value_counts())