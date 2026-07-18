<div align="center">
  <h1>CubeDuel 🧊</h1>
  
  <p><b>A High-Performance Algorithmic Visualization Engine & Rubik's Cube Solver</b></p>

  [![Live Demo](https://img.shields.io/badge/Live_Demo-Available_Now-00c853?style=for-the-badge&logo=vercel)](https://cube-duel-nine.vercel.app/)

  <img src="https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Three.js-WebGL-black?style=flat-square&logo=three.js" alt="Three.js" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.10-3776AB?style=flat-square&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript" alt="TypeScript" />
</div>

<br/>

CubeDuel is a full-stack engineering demonstration that pits a custom **IDA* Heuristic Graph Search** engine against the mathematical perfection of **Kociemba's Algorithm**. 

Built to visualize the scaling limits of brute-force compute versus group theory in a $43 \times 10^{18}$ state space, the platform features a custom-built 3D WebGL rendering engine that perfectly synchronizes mathematical state arrays with fluid 60FPS animations.

---

## ⚡ Engineering Highlights

### 1. Complex State Synchronization & Concurrency
Built a bespoke rendering lifecycle bridging React's asynchronous reconciliation with the synchronous `useFrame` loop of `react-three-fiber`.
*   **Problem:** Rapid user interactions (timeline scrubbing) during active 3D animations caused mathematically corrupted matrix states due to React's asynchronous functional updaters executing stale closures.
*   **Solution:** Engineered a stateless remounting architecture utilizing deterministic "mathematical snapshotting" combined with synchronous memory refs, ensuring 100% frame-perfect state accuracy under heavy interaction loads.

### 2. High-Performance Algorithm Design
Engineered two distinct solver backends to demonstrate time-complexity variance:
*   **Kociemba's Algorithm:** Implemented a two-phase group theory solver that reduces the $4.3 \times 10^{19}$ state space into two overlapping sub-groups, generating 20-move solutions in `< 0.05 seconds`.
*   **IDA* (Iterative Deepening A*):** Designed a custom brute-force graph search utilizing a precomputed Heuristic Pattern Database. Compresses millions of states into memory to aggressively prune unpromising branches dynamically.

### 3. Bidirectional WebSockets & Telemetry Streaming
*   Implemented a non-blocking WebSocket pipeline via FastAPI.
*   Capable of streaming thousands of granular telemetry events (nodes explored, depth limits, heuristic evaluations) per second to the client.
*   Integrated React components that parse and visualize this high-frequency datastream without triggering catastrophic re-renders or dropping the WebGL framerate.

---

## 🏗️ System Architecture

### Frontend (Next.js & WebGL)
*   **`CubeEngine.ts`**: Pure mathematical representation of the cube using 6-axis matrix rotations. Completely decoupled from the UI.
*   **`CubeAnimator.ts`**: The physics layer. Uses spherical linear interpolation (SLERP) and Quaternion math to calculate fluid rotational arcs between mathematical states.
*   **React-Three-Fiber**: Translates the Animator's quaternion data into real-time WebGL meshes rendered on the Canvas.

### Backend (FastAPI & Python)
*   **Asynchronous Endpoints**: RESTful API for stateless Kociemba solving and scramble generation.
*   **WebSocket Controller**: Dedicated concurrent workers that stream IDA* node traversals asynchronously.

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+

### 1. Start the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:3000` to view the application.

---

## 🌎 Deployment

- **Frontend:** Hosted on [Vercel](https://vercel.com) (Edge Network).
- **Backend:** Hosted on [Render](https://render.com) (Serverless Containers).
