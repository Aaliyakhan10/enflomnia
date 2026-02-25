"""
AWS Lambda entry point.
Wraps the FastAPI app with Mangum for serverless deployment.
"""
from mangum import Mangum
from app.main import app

handler = Mangum(app, lifespan="off")
