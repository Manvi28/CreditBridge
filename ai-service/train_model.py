import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

def preprocess_data(df):
    """Preprocess the data for training"""
    
    # Create a copy
    df_processed = df.copy()
    
    # Encode categorical variables
    label_encoders = {}
    
    # Gender encoding
    le_gender = LabelEncoder()
    df_processed['gender_encoded'] = le_gender.fit_transform(df_processed['gender'])
    label_encoders['gender'] = le_gender
    
    # Education level encoding (ordinal)
    education_mapping = {
        'other': 0,
        'high-school': 1,
        'bachelors': 2,
        'masters': 3,
        'phd': 4
    }
    df_processed['education_encoded'] = df_processed['education_level'].map(education_mapping)
    
    # Occupation type encoding (ordinal)
    occupation_mapping = {
        'entry-level': 0,
        'semi-skilled': 1,
        'skilled': 2,
        'professional': 3
    }
    df_processed['occupation_encoded'] = df_processed['occupation_type'].map(occupation_mapping)
    
    # Select features for training
    feature_columns = [
        'age',
        'gender_encoded',
        'education_encoded',
        'occupation_encoded',
        'avg_income',
        'income_stability',
        'income_month_1',
        'income_month_2',
        'income_month_3',
        'income_month_4',
        'income_month_5',
        'income_month_6',
        'rent_payment',
        'utility1_payment',
        'utility2_payment'
    ]
    
    X = df_processed[feature_columns]
    y = df_processed['credit_score']
    
    return X, y, label_encoders

def train_model():
    """Train the credit scoring model"""
    
    # Load the synthetic data
    if not os.path.exists('synthetic_credit_data.csv'):
        print("Generating synthetic data...")
        from generate_data import generate_synthetic_data
        df = generate_synthetic_data(5000)
        df.to_csv('synthetic_credit_data.csv', index=False)
    else:
        df = pd.read_csv('synthetic_credit_data.csv')
    
    print(f"Loaded {len(df)} samples")
    
    # Preprocess data
    X, y, label_encoders = preprocess_data(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"Training set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")
    
    # Train Random Forest model
    print("\nTraining Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_mae = mean_absolute_error(y_train, y_pred_train)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)
    
    print(f"\nModel Performance:")
    print(f"Training MAE: {train_mae:.2f}")
    print(f"Test MAE: {test_mae:.2f}")
    print(f"Training R²: {train_r2:.3f}")
    print(f"Test R²: {test_r2:.3f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\nTop 10 Most Important Features:")
    print(feature_importance.head(10))
    
    # Save model and encoders
    joblib.dump(model, 'credit_score_model.pkl')
    joblib.dump(label_encoders, 'label_encoders.pkl')
    
    # Save feature names for prediction
    joblib.dump(list(X.columns), 'feature_names.pkl')
    
    print(f"\nModel saved successfully!")
    
    return model, label_encoders

if __name__ == "__main__":
    train_model()