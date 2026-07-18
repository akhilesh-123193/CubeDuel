import threading
import time

class TelemetryState:
    def __init__(self):
        self.lock = threading.Lock()
        self.is_active = False
        self.start_time = 0
        
        self.nodes_explored = 0
        self.branches_pruned = 0
        self.current_depth_limit = 0
        self.current_path = []
        self.current_h = 0
        self.best_h = float('inf')
        
        self.result = None
        self.error = None
        
    def start(self):
        with self.lock:
            self.is_active = True
            self.start_time = time.time()
            self.nodes_explored = 0
            self.branches_pruned = 0
            self.current_depth_limit = 0
            self.current_path = []
            self.current_h = 0
            self.best_h = float('inf')
            self.result = None
            self.error = None
            
    def update(self, nodes=0, pruned=0, path=None, h=None):
        with self.lock:
            if nodes: self.nodes_explored += nodes
            if pruned: self.branches_pruned += pruned
            if path is not None: self.current_path = path
            if h is not None:
                self.current_h = h
                if h < self.best_h:
                    self.best_h = h
                    
    def set_depth_limit(self, limit: int):
        with self.lock:
            self.current_depth_limit = limit
            
    def finish(self, result):
        with self.lock:
            self.is_active = False
            self.result = result
            
    def fail(self, error):
        with self.lock:
            self.is_active = False
            self.error = error
            
    def get_snapshot(self):
        with self.lock:
            elapsed = time.time() - self.start_time if self.start_time else 0
            nps = int(self.nodes_explored / elapsed) if elapsed > 0 else 0
            return {
                "is_active": self.is_active,
                "elapsed_ms": int(elapsed * 1000),
                "nodes_explored": self.nodes_explored,
                "branches_pruned": self.branches_pruned,
                "nodes_per_second": nps,
                "current_depth_limit": self.current_depth_limit,
                "current_path": self.current_path,
                "current_h": self.current_h,
                "best_h": self.best_h if self.best_h != float('inf') else 0,
                "result": self.result,
                "error": self.error
            }
