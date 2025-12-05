# 🛡️ BlockSentinel

**AI-Powered Smart Contract Security Scanner**

BlockSentinel is a comprehensive security analysis platform for Ethereum smart contracts that combines industry-standard static analysis tools with AI-powered vulnerability detection. Built with Next.js, FastAPI, and powered by Slither, Mythril, and Llama 3.2.

![BlockSentinel](https://img.shields.io/badge/Security-Scanner-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🌟 Features

### Multi-Layer Analysis Pipeline
- **🔍 Slither Static Analysis** - Industry-standard static analysis from Trail of Bits with 90+ detectors
- **⚡ Mythril Symbolic Execution** - Deep security analysis through symbolic execution and SMT solving
- **🤖 AI-Powered Detection** - Local Llama 3.2 3B model for intelligent vulnerability pattern recognition
- **📊 Comprehensive Reports** - Exportable reports in PDF, JSON, CSV, and HTML formats

### Smart Contract Scanning
- **📤 File Upload** - Direct upload of Solidity (.sol) files with strict validation
- **🔗 Address Scanning** - Fetch and analyze verified contracts from Ethereum Mainnet and Sepolia testnet
- **⏱️ Real-Time Progress** - Live stage tracking (Initialization → Slither → Mythril → AI → Report)
- **🎯 Severity Classification** - Critical, High, Medium, and Low severity ratings

### User Experience
- **🔐 Web3 Integration** - Connect wallet via ThirdWeb for personalized dashboard
- **📱 Responsive Design** - Modern UI built with Tailwind CSS and shadcn/ui
- **💾 Cloud Storage** - Reports stored securely in Supabase Storage
- **📈 Scan History** - Track and manage all your security scans

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- **Framework:** Next.js 16 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix UI)
- **Web3:** ThirdWeb SDK
- **State Management:** React Hooks

**Backend:**
- **Framework:** FastAPI (Python 3.13)
- **Database:** PostgreSQL (Supabase)
- **ORM:** SQLAlchemy
- **Storage:** Supabase Storage
- **Container Runtime:** Docker

**Analysis Tools:**
- **Slither:** Dockerized static analysis
- **Mythril:** Dockerized symbolic execution
- **AI Model:** Ollama + Llama 3.2 3B (local)

**External APIs:**
- **Etherscan API:** Contract source code fetching (V2 API)
- **Supabase:** PostgreSQL database and file storage

---

## 📋 Prerequisites

### Required Software
- **Node.js** >= 18.x
- **Python** >= 3.13
- **Docker Desktop** (for Slither/Mythril containers)
- **Ollama** (for AI analysis)
- **Git**

### Required Accounts
- **Supabase Account** - Free tier works perfectly
  - PostgreSQL database
  - Storage bucket
- **Etherscan API Key** - Free tier (5 requests/sec)
- **ThirdWeb Client ID** - Free for development

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/RogerrMonkey/blocksentinel.git
cd blocksentinel
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Frontend (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Backend (FastAPI)
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-REGION.pooler.supabase.com:6543/postgres

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_STORAGE_BUCKET=scan-reports

# Etherscan
ETHERSCAN_API_KEY=your_etherscan_api_key

# Security
SECRET_KEY=your_random_secret_key_here
DEBUG=True

# API Configuration
API_V1_PREFIX=/api/v1
PROJECT_NAME=BlockSentinel
VERSION=1.0.0
LOG_LEVEL=INFO

# CORS
FRONTEND_URL=http://localhost:3000

# AI Analysis (Ollama)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
AI_PROVIDER=ollama

# File Storage
REPORTS_DIR=./reports
MAX_UPLOAD_SIZE_MB=10

# Analysis Timeouts
SLITHER_TIMEOUT=120
DOCKER_TIMEOUT=300
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### 3. Database Setup

#### Initialize Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the initialization script:

```bash
cd backend
# Copy and paste the contents of init_supabase.sql into Supabase SQL Editor
```

4. Create storage bucket:
   - Go to **Storage** → Create bucket named `scan-reports`
   - Set as **Public bucket**

#### Run Migrations

```bash
cd backend/migrations
python run_migration.py
python run_current_stage_migration.py
```

### 4. Install Dependencies

#### Frontend

```bash
npm install
```

#### Backend

```bash
cd backend
pip install -r requirements.txt
```

### 5. Install Analysis Tools

#### Install Ollama (AI Analysis)

**Windows:**
Download from [ollama.ai](https://ollama.ai/download)

**macOS/Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Pull Llama 3.2 Model:**
```bash
ollama pull llama3.2:3b
```

#### Build Slither Docker Image

```bash
cd backend
docker build -f Dockerfile.slither -t blocksentinel-slither:latest .
```

#### Pull Mythril Docker Image

```bash
docker pull mythril/myth:latest
```

### 6. Start the Application

#### Start Backend (Terminal 1)

```bash
cd backend
python main.py
```

Backend will run on: `http://localhost:8000`

#### Start Frontend (Terminal 2)

```bash
npm run dev
```

Frontend will run on: `http://localhost:3000`

#### Start Ollama (Terminal 3)

```bash
ollama serve
```

Ollama API will run on: `http://localhost:11434`

---

## 📖 Usage

### Scanning Smart Contracts

#### Method 1: Upload File
1. Navigate to **New Scan** page
2. Click **Upload Contract** tab
3. Select your `.sol` file (max 1MB)
4. Click **Start Scan**

#### Method 2: Scan by Address
1. Navigate to **New Scan** page
2. Click **Scan by Address** tab
3. Enter contract address (0x...)
4. Select network (Mainnet or Sepolia)
5. Click **Fetch & Scan**

### Viewing Results

- **Progress Page:** Real-time analysis progress with stage tracking
- **Results Page:** Detailed findings with severity, line numbers, and remediation
- **Reports:** Export findings in PDF, JSON, CSV, or HTML format
- **Dashboard:** View scan history and statistics

---

## 🎯 Supported Vulnerabilities

BlockSentinel detects 50+ vulnerability types including:

### Critical Severity
- Reentrancy attacks
- Unprotected selfdestruct
- Delegatecall to untrusted contracts
- Arbitrary code execution

### High Severity
- Integer overflow/underflow
- Unchecked external calls
- Access control issues
- Front-running vulnerabilities

### Medium Severity
- Timestamp dependence
- Block gas limit issues
- Deprecated functions
- Missing events

### Low Severity
- Code optimization opportunities
- Style guide violations
- Unused variables
- Naming conventions

---

## ⚙️ Configuration

### Adjusting Analysis Timeouts

Edit `backend/app/core/config.py`:

```python
SLITHER_TIMEOUT = 120  # Slither timeout in seconds
DOCKER_TIMEOUT = 300   # Docker build timeout
```

### Changing AI Model

Edit `.env`:

```env
OLLAMA_MODEL=llama3.2:3b  # or llama3.2:1b for faster analysis
```

### Network Support

Currently supports:
- **Ethereum Mainnet** (Chain ID: 1)
- **Sepolia Testnet** (Chain ID: 11155111)



---

## 🔒 Security & Privacy

- **Local AI Processing:** All AI analysis runs locally via Ollama - no data sent to external APIs
- **Secure Storage:** Reports stored in Supabase with proper access controls
- **No Source Code Retention:** Contract source code is not permanently stored
- **API Key Protection:** Environment variables for sensitive credentials
- **PostgreSQL Injection Prevention:** SQLAlchemy ORM with parameterized queries

---

## 📊 Project Structure

```
blocksentinel/
├── app/                          # Next.js frontend
│   ├── api-keys/                # API key management
│   ├── dashboard/               # User dashboard
│   ├── reports/                 # Scan reports list
│   ├── scan/                    # Scan pages
│   │   ├── new/                # New scan form
│   │   └── [id]/               # Scan details
│   │       ├── progress/       # Real-time progress
│   │       └── results/        # Scan results
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── api/                # API routes
│   │   ├── core/               # Configuration
│   │   ├── models/             # Database models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # Business logic
│   │       ├── ai_analyzer.py  # AI analysis
│   │       ├── etherscan.py    # Contract fetching
│   │       ├── mythril.py      # Mythril integration
│   │       ├── slither.py      # Slither integration
│   │       ├── scanner.py      # Scan orchestration
│   │       └── storage.py      # Supabase storage
│   ├── migrations/             # Database migrations
│   ├── Dockerfile.slither      # Slither container
│   ├── init_supabase.sql       # Database schema
│   └── main.py                 # FastAPI entry point
├── components/                  # React components
│   ├── ui/                     # shadcn/ui components
│   ├── navbar.tsx              # Navigation bar
│   ├── footer.tsx              # Footer with credits
│   └── Web3Provider.tsx        # Web3 context
├── lib/                        # Utilities
│   ├── api.ts                  # API client
│   ├── types.ts                # TypeScript types
│   └── client.ts               # ThirdWeb client
└── public/                     # Static assets
```

---

## 🐛 Known Issues & Limitations

### Current Limitations
- **AI Memory:** Llama 3.2 3B requires ~2.3GB RAM (may fail on low-memory systems)
- **Analysis Time:** Large contracts (>1000 lines) may take 2-5 minutes
- **Docker Required:** Slither and Mythril require Docker Desktop running
- **Verified Contracts Only:** Address scanning only works for verified contracts on Etherscan

### Workarounds
- **Low RAM:** Use `llama3.2:1b` model (requires only 1.5GB RAM)
- **No Docker:** Run Slither/Mythril locally (requires Python environment setup)
- **Unverified Contracts:** Use file upload instead of address scanning

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Trail of Bits** - Slither static analysis framework
- **ConsenSys** - Mythril symbolic execution engine
- **Meta AI** - Llama language models
- **Supabase** - PostgreSQL database and storage
- **ThirdWeb** - Web3 authentication
- **Etherscan** - Contract source code API

---

## 📧 Contact

**Developer:** RogerrMonkey

**Email:** harshpatil.prf@gmail.com

**GitHub:** [@RogerrMonkey](https://github.com/RogerrMonkey)

---

<div align="center">
  <p>Made with ❤️ by RogerrMonkey</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>

