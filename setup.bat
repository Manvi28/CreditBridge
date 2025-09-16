@echo off
echo Setting up CreditBridge...
echo.

echo Installing Frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Installing Backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing Python dependencies...
cd ai-service
pip install -r requirements.txt

echo.
echo Generating training data and training model...
python generate_data.py
python train_model.py
cd ..

echo.
echo ========================================
echo Setup complete!
echo.
echo To start the application, run: start.bat
echo ========================================
pause