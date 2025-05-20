import uvicorn
from fastapi import FastAPI
from routes.routes import router
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI application and router
app = FastAPI()
app.include_router(router)

# Configure CORS for local development
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

# Development server configuration
if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="127.0.0.1",
        port=8000,
        reload=True
    )