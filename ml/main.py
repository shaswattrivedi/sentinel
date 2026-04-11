import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.routes import dashboard, predict, telemetry

app = FastAPI(title="SENTINEL Intelligence API", version="1.0")

# Minimal CORS for dashboard usage; tighten in production as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry.router)
app.include_router(predict.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"service": "SENTINEL backend", "status": "ok"}


def start():  # Entry point for `python -m main`
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)


if __name__ == "__main__":
    start()
