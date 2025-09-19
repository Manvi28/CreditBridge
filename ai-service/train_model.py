# train_model.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

def load_data(path='credit_data.csv'):
    df = pd.read_csv(path)
    # Fill blanks
    df['gpa'] = pd.to_numeric(df['gpa'], errors='coerce').fillna(0)
    df['collegeScore'] = pd.to_numeric(df['collegeScore'], errors='coerce').fillna(50)
    df['cosignerIncome'] = pd.to_numeric(df['cosignerIncome'], errors='coerce').fillna(0)
    df['scholarship'] = pd.to_numeric(df['scholarship'], errors='coerce').fillna(0)

    # payment mapping
    pay_map = {'on-time':1.0, 'na':0.5, 'late':0.0}
    df['rentPayment'] = df['rentPayment'].map(pay_map).fillna(1.0)
    df['utility1Payment'] = df['utility1Payment'].map(pay_map).fillna(1.0)
    df['utility2Payment'] = df['utility2Payment'].map(pay_map).fillna(1.0)

    return df

def prepare_features(df):
    le_gender = LabelEncoder()
    df['gender_enc'] = le_gender.fit_transform(df['gender'].astype(str))

    # education mapping
    edu_map = {'other':0,'high-school':1,'bachelors':2,'masters':3,'phd':4}
    df['edu_enc'] = df['educationLevel'].map(edu_map).fillna(0)

    # occupation mapping simple: professional/skilled/semiskilled/entry
    def occ_cat(occ):
        occ = str(occ).lower()
        if any(k in occ for k in ['engineer','doctor','lawyer','manager','software']): return 'professional'
        if any(k in occ for k in ['analyst','technician','nurse']): return 'skilled'
        if any(k in occ for k in ['clerk','sales']): return 'semi-skilled'
        return 'entry-level'
    df['occ_cat'] = df['occupation'].apply(occ_cat)
    le_occ = LabelEncoder()
    df['occ_enc'] = le_occ.fit_transform(df['occ_cat'])

    # feature set: include both student and working features; missing ones are fine (0)
    df['avg_income'] = df[['income_month_1','income_month_2','income_month_3','income_month_4','income_month_5','income_month_6']].mean(axis=1).fillna(0)
    df['income_stability'] = 1 - df[['income_month_1','income_month_2','income_month_3','income_month_4','income_month_5','income_month_6']].std(axis=1).fillna(0) / (df['avg_income'].replace(0, np.nan)).fillna(1)
    df['income_stability'] = df['income_stability'].fillna(0)

    feature_cols = [
        'age','gender_enc','edu_enc','occ_enc',
        'avg_income','income_stability',
        'income_month_1','income_month_2','income_month_3','income_month_4','income_month_5','income_month_6',
        'rentPayment','utility1Payment','utility2Payment',
        'gpa','collegeScore','cosignerIncome','scholarship'
    ]

    X = df[feature_cols].fillna(0)
    y = df['creditScore'].astype(int)

    # save label encoders and feature_names
    label_encoders = {
        'gender': le_gender,
        'occupation_cat': le_occ
    }
    joblib.dump(label_encoders, 'label_encoders.pkl')
    joblib.dump(feature_cols, 'feature_names.pkl')
    print("Saved label_encoders.pkl and feature_names.pkl")

    return X, y

def train_model():
    df = load_data('credit_data.csv')
    X, y = prepare_features(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.12, random_state=42)

    model = RandomForestRegressor(n_estimators=150, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"Train R2: {train_score:.3f}, Test R2: {test_score:.3f}")

    joblib.dump(model, 'credit_score_model.pkl')
    print("Saved credit_score_model.pkl")

if __name__ == '__main__':
    train_model()
