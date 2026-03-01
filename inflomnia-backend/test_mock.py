from app.database import SessionLocal
from app.services.workload_signal import WorkloadSignalService
from app.services.reach_anomaly import ReachAnomalyService
from app.models.reel import Reel
import uuid

def test_mock_generation():
    db = SessionLocal()
    creator_id = str(uuid.uuid4())
    print("Testing with new creator:", creator_id)
    
    wk_service = WorkloadSignalService()
    print("Testing Workload Signal Heatmap (should trigger mock gen)...")
    heatmap = wk_service.compute_heatmap(db, creator_id)
    print("Heatmap keys:", list(heatmap.keys())[:2])

    reels_count = db.query(Reel).filter(Reel.creator_id == creator_id).count()
    print("Reels count after mock generation:", reels_count)
    
    ra_service = ReachAnomalyService()
    print("Testing Reach Anomaly...")
    res = ra_service.analyze(db, creator_id)
    print("Reach Anomaly Result Type:", type(res))
    
    db.close()

if __name__ == "__main__":
    test_mock_generation()
