# CubeDuel

Two algorithms solve the same cube — one brute-forces its way through millions of possible states, the other uses 70 years of group theory to skip almost all of them. Scramble the cube and watch them race. 

![CubeDuel Dashboard Screenshot](/docs/screenshot.jpg)

## Tech Stack

- **Frontend**: Next.js (App Router), React Three Fiber (3D Rendering), Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI (Python 3.10+), WebSockets for real-time telemetry streaming.
- **Solvers**: Custom Python IDA* graph search engine & Python Kociemba standard library.

## How it Works

CubeDuel compares a custom-built heuristic search engine against an optimal mathematical solver to demonstrate algorithmic scaling limits.

### What is a "state space"?
Every possible arrangement of a scrambled cube. There are about 43 quintillion of them.

### What is IDA*?
A search strategy that tries short solutions first, then gradually allows longer ones, backtracking whenever a path looks unpromising.

### What is a pattern database?
A precomputed table of "roughly how many moves away from solved is this partial state" — used to skip bad paths early instead of exploring them fully.

### Why does Kociemba always win?
Group theory allows the cube's 43-quintillion-state problem to be mathematically split into two much smaller sub-problems, so the "optimal" solver only ever needs to search a tiny fraction of the total space, instead of wandering through it.

## Local Development

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt # (fastapi, uvicorn, pydantic, kociemba, websockets)
   ```
4. Start the server (ensure you are in the venv):
   ```bash
   PYTHONPATH=. uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
