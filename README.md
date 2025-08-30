StudyMate – AI Powered Research Assistant

StudyMate is a comprehensive AI-powered research assistant that helps you upload documents, ask intelligent questions, and generate audio summaries with speech capabilities.
Built with FastAPI backend, React frontend, and an optional Streamlit interface.

✨ Features

📄 Document Processing – Upload PDFs and extract text

🤖 AI Question Answering – Ask questions with intelligent responses

🔊 Text-to-Speech – Listen to answers via speech synthesis

🎧 Audio Summaries – Generate complete audio summaries of documents

🌓 Dark/Light Mode – Modern theme switching

💬 Chat Interface – Interactive Q&A with your documents

📒 Notebook Management – Organize multiple documents and sessions

🔍 Semantic Search – Advanced document search with embeddings

🏗️ Architecture
StudyMate/
├── backend/                # FastAPI application
│   ├── main.py
│   ├── utils/              # LLM & text processing
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   └── package.json
├── streamlit_app.py        # Optional Streamlit interface
└── README.md

⚡ Quick Start
Prerequisites

Python 3.8+

Node.js 16+

pip & npm

Backend Setup
git clone https://github.com/Srinath-Badaveni/LexoraAI.git
cd studymate/backend

# Create venv
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --host 0.0.0.0 --port 8001 --reload


API available at: http://localhost:8001

Frontend Setup (React)
cd ../frontend
npm install
npm start


Frontend runs at: http://localhost:3000

Alternative: Streamlit Interface
pip install streamlit requests PyMuPDF gtts
streamlit run streamlit_app.py

📡 API Endpoints

Base URL: http://localhost:8001/hackrx

POST /create-notebook – Upload PDF & create notebook

POST /query-notebook – Ask questions on a notebook

GET /notebooks – List all notebooks

GET /notebooks/{id} – Get details of a specific notebook

DELETE /notebooks/{id} – Delete a notebook

POST /get-summary – Generate audio summary

GET /health – Health check

🚀 Usage
Upload & Process Document (Python Example)
import requests

with open("document.pdf", "rb") as f:
    res = requests.post("http://localhost:8001/hackrx/create-notebook", files={"file": f})
notebook = res.json()
print("Notebook ID:", notebook["notebook_id"])

Ask Questions
res = requests.post("http://localhost:8001/hackrx/query-notebook",
    json={"notebook_id": notebook["notebook_id"], "question": "What is this about?"})
print("Answer:", res.json()["answer"])

📦 Deployment
Docker
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]

docker build -t studymate-backend .
docker run -p 8001:8001 studymate-backend

🛠️ Contributing

Fork the repo

Create a feature branch (git checkout -b feature/xyz)

Commit your changes

Push & open a PR

📜 License

Licensed under the MIT License
.
