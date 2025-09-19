# generate_data.py
import csv
import random
import numpy as np
import pandas as pd

def random_college_score(name=None):
    # simple mapping probability; in real world you'd map known colleges to tiers
    return random.randint(40, 95)

def gen_working_row():
    # generate 6 months income between 10000 - 120000 (INR) as realistic spread
    monthly = [round(random.uniform(10000, 120000), 2) for _ in range(6)]
    avg_income = np.mean(monthly)
    # payment behavior: probability to be on-time increases with income
    pay_prob = min(0.95, 0.3 + (avg_income / 120000))
    def pay():
        r = random.random()
        if r < pay_prob: return 'on-time'
        if r < pay_prob + 0.15: return 'late'
        return 'na'
    row = {
        'userType': 'working',
        'age': random.randint(22, 60),
        'gender': random.choice(['male','female','other']),
        'educationLevel': random.choices(['high-school','bachelors','masters','phd','other'], [0.05,0.6,0.25,0.05,0.05])[0],
        'occupation': random.choice(['software engineer','teacher','analyst','manager','sales','technician','clerk']),
        'monthlyIncome': monthly,
        'rentPayment': pay(),
        'utility1Payment': pay(),
        'utility2Payment': pay(),
        'gpa': None,
        'collegeScore': None,
        'cosignerIncome': None,
        'scholarship': None
    }
    return row

def gen_student_row():
    # students: optional part-time income 0-5000
    monthly = [round(random.uniform(0, 5000), 2) if random.random() < 0.4 else 0.0 for _ in range(6)]
    gpa = round(random.uniform(5.0, 10.0), 2)  # 0-10 scale
    collegeScore = random_college_score()
    cosignerIncome = round(random.uniform(0, 150000), 2) if random.random() < 0.3 else 0.0
    scholarship = random.choice([0,1]) if random.random() < 0.25 else 0
    row = {
        'userType': 'student',
        'age': random.randint(17, 30),
        'gender': random.choice(['male','female','other']),
        'educationLevel': random.choices(['high-school','bachelors','masters','other'], [0.1,0.7,0.05,0.15])[0],
        'occupation': 'student',
        'monthlyIncome': monthly,
        'rentPayment': random.choice(['on-time','late','na']),
        'utility1Payment': random.choice(['on-time','late','na']),
        'utility2Payment': random.choice(['on-time','late','na']),
        'gpa': gpa,
        'collegeScore': collegeScore,
        'cosignerIncome': cosignerIncome,
        'scholarship': scholarship
    }
    return row

def build_dataset(total=50000, students_ratio=0.5):
    rows = []
    students = int(total * students_ratio)
    workers = total - students
    for _ in range(workers):
        rows.append(gen_working_row())
    for _ in range(students):
        rows.append(gen_student_row())
    random.shuffle(rows)
    return rows

def synthesize_score(row):
    # heuristic function to create a realistic credit score for synthetic label
    base = 50
    # common adjustments
    edu_map = {'other': -3, 'high-school': -1, 'bachelors': 3, 'masters': 6, 'phd': 8}
    base += edu_map.get(row['educationLevel'], 0)
    # working
    if row['userType'] == 'working':
        incomes = row['monthlyIncome']
        avg_income = np.mean(incomes) if incomes else 0
        stability = 1 - (np.std(incomes) / avg_income) if avg_income > 0 else 0
        # payment score
        payment_map = {'on-time': 1, 'na': 0.5, 'late': 0}
        pscore = (payment_map[row['rentPayment']] + payment_map[row['utility1Payment']] + payment_map[row['utility2Payment']]) / 3
        base += (np.clip(avg_income/20000, 0, 30)) * 0.6   # income influence
        base += stability * 10
        base += (pscore - 0.5) * 40  # payment is strong signal
    else:  # student
        gpa = row.get('gpa') or 6.0
        college = row.get('collegeScore') or 50
        cosigner = row.get('cosignerIncome') or 0
        scholarship = row.get('scholarship') or 0
        avg_part = np.mean(row['monthlyIncome']) if row['monthlyIncome'] else 0
        base += (gpa - 5.0) * 5        # stronger GPA helps
        base += (college - 50) * 0.2
        base += np.clip(cosigner/30000, 0, 10)
        base += scholarship * 5
        base += np.clip(avg_part/2000, 0, 5)
    # add small noise
    score = base + random.gauss(0, 5)
    return int(max(0, min(100, round(score))))

def export_csv(rows, filename='credit_data.csv'):
    # flatten monthlyIncome into columns
    cols = [
        'userType','age','gender','educationLevel','occupation',
        'income_month_1','income_month_2','income_month_3','income_month_4','income_month_5','income_month_6',
        'rentPayment','utility1Payment','utility2Payment',
        'gpa','collegeScore','cosignerIncome','scholarship','creditScore'
    ]
    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=cols)
        writer.writeheader()
        for r in rows:
            out = {
                'userType': r['userType'],
                'age': r['age'],
                'gender': r['gender'],
                'educationLevel': r['educationLevel'],
                'occupation': r['occupation'],
                'income_month_1': r['monthlyIncome'][0] if len(r['monthlyIncome'])>0 else 0,
                'income_month_2': r['monthlyIncome'][1] if len(r['monthlyIncome'])>1 else 0,
                'income_month_3': r['monthlyIncome'][2] if len(r['monthlyIncome'])>2 else 0,
                'income_month_4': r['monthlyIncome'][3] if len(r['monthlyIncome'])>3 else 0,
                'income_month_5': r['monthlyIncome'][4] if len(r['monthlyIncome'])>4 else 0,
                'income_month_6': r['monthlyIncome'][5] if len(r['monthlyIncome'])>5 else 0,
                'rentPayment': r['rentPayment'],
                'utility1Payment': r['utility1Payment'],
                'utility2Payment': r['utility2Payment'],
                'gpa': r['gpa'] if r['gpa'] is not None else '',
                'collegeScore': r['collegeScore'] if r['collegeScore'] is not None else '',
                'cosignerIncome': r['cosignerIncome'] if r['cosignerIncome'] is not None else '',
                'scholarship': r['scholarship'] if r['scholarship'] is not None else '',
            }
            out['creditScore'] = synthesize_score(r)
            writer.writerow(out)
    print(f"Saved {filename}")

if __name__ == '__main__':
    print("Generating synthetic dataset (50k rows)... this may take a minute.")
    rows = build_dataset(total=50000, students_ratio=0.5)
    export_csv(rows)
    print("Done.")
