import asyncio
import concurrent.futures
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from engine.telemetry import TelemetryState
from engine.search import IDAStarSolver
import traceback

router = APIRouter()
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

@router.websocket("/ws/solve")
async def websocket_solve(websocket: WebSocket):
    await websocket.accept()
    try:
        # Wait for the initial state message
        data = await websocket.receive_json()
        state_string = data.get("state")
        max_depth = data.get("max_depth", 10) # Safe default
        
        if not state_string or len(state_string) != 54:
            await websocket.send_json({"type": "error", "message": "Invalid state"})
            await websocket.close()
            return
            
        telemetry = TelemetryState()
        solver = IDAStarSolver(telemetry)
        
        # Start search in background thread
        future = executor.submit(solver.solve, state_string, max_depth)
        
        # Stream telemetry loop
        while not future.done():
            snapshot = telemetry.get_snapshot()
            
            if snapshot["is_active"]:
                await websocket.send_json({
                    "type": "telemetry",
                    "depth": snapshot["current_depth_limit"],
                    "nodes": snapshot["nodes_explored"],
                    "pruned": snapshot["branches_pruned"],
                    "nps": snapshot["nodes_per_second"],
                    "h_cost": snapshot["current_h"],
                    "best_h": snapshot["best_h"],
                    "path": snapshot["current_path"],
                    "elapsed": snapshot["elapsed_ms"]
                })
            
            # 20 FPS telemetry (50ms sleep)
            await asyncio.sleep(0.05)
            
        # Ensure any exceptions in the thread are caught
        try:
            future.result()
        except Exception as e:
            print("Solver Exception:", traceback.format_exc())
            await websocket.send_json({
                "type": "error",
                "message": f"Server Error: {str(e)}"
            })
            await websocket.close()
            return
            
        final = telemetry.get_snapshot()
        
        if final["result"]:
            await websocket.send_json({
                "type": "result",
                "status": "success",
                "solution": final["result"]["solution"],
                "moves": final["result"]["moves"],
                "time_ms": final["result"]["time_ms"],
                "nodes_visited": final["result"]["nodes_visited"]
            })
        else:
            await websocket.send_json({
                "type": "result",
                "status": "timeout",
                "reason": final["error"] or "Maximum search depth exceeded.",
                "nodes_visited": final["nodes_explored"],
                "time_ms": final["elapsed_ms"]
            })
            
        await websocket.close()
            
    except WebSocketDisconnect:
        print("Client disconnected")
