import sys
from app.database import SessionLocal
from app.services.workload_signal import WorkloadSignalService
from app.services.reach_anomaly import ReachAnomalyService

db = SessionLocal()
creator_id = "demo-creator-001"

w = WorkloadSignalService()
r = ReachAnomalyService()

print("Workload Compute Heatmap:")
try:
    print(w.compute_heatmap(db, creator_id))
except Exception as e:
    print("Workload error:", e)

print("\nReach Analyze:")
try:
    print(r.analyze(db, creator_id))
except Exception as e:
    import traceback
    traceback.print_exc()

print("\nFinished tests.")
