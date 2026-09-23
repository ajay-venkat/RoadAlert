Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend; .\venv\Scripts\activate; pip install -r requirements.txt; uvicorn main:app --reload`""
Start-Process powershell -ArgumentList "-NoExit -Command `"cd dashboard; npm run dev`""
