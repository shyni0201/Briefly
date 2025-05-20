from fastapi import APIRouter, HTTPException, status, Depends, Security, Body,  Form, UploadFile, File
from services.service import *
from models.models import User, Summary
from exceptions import *
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from fastapi.responses import StreamingResponse

router = APIRouter()
security = HTTPBearer()

# JWT token verification middleware
def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Middleware to verify JWT token
    Input: HTTPAuthorizationCredentials object containing the JWT token
    Output: None if valid, raises HTTPException if invalid
    """
    token = credentials.credentials
    try:
        jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# User Management Routes
@router.post("/user/create", status_code=status.HTTP_201_CREATED)
async def create_new_user(obj: User):
    """
    Creates a new user account
    Input: User object containing email and password
    Output: Dict containing status and user details
    Raises: HTTPException if user creation fails
    """
    try:
        res = service_create_new_user(obj)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.post("/user/verify", status_code=status.HTTP_200_OK)
async def verify_user(obj: User):
    """
    Authenticates user and returns JWT token
    Input: User object containing email and password
    Output: Dict containing status and JWT token
    Raises: HTTPException if authentication fails
    """
    try:
        res = service_verify_user(obj)
        return {"status": "OK", "result": res}
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

# Summary Management Routes
@router.get("/summaries/{userId}", status_code=status.HTTP_200_OK)
async def user_summaries(userId: str, _ = Depends(verify_token)):
    """
    Retrieves all summaries for a given user
    Input: userId (str), JWT token
    Output: Dict containing status and list of summaries
    Raises: HTTPException if user not found or unauthorized
    """
    try:
        res = service_user_summaries(userId)
        return {"status": "OK", "result": res}
    except NotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.post("/summary/create", status_code=status.HTTP_201_CREATED)
async def create_summary(obj: Summary = Body(...), _ = Depends(verify_token)):
    """
    Creates a new summary from text input
    Input: Summary object containing text and metadata, JWT token
    Output: Dict containing status and created summary
    Raises: HTTPException if summary creation fails
    """
    try:
        res = service_create_summary(obj)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)    

@router.post("/summary/upload", status_code=status.HTTP_201_CREATED)
async def create_summary_upload(
    userId: str = Form(...),
    type: str = Form(...),
    uploadType: str = Form(...),
    file: UploadFile = File(...),
    _ = Depends(verify_token)
):
    """
    Creates a new summary from uploaded file
    Input: 
        - userId (str): ID of the user
        - type (str): Type of summary
        - uploadType (str): Type of upload (e.g., 'pdf', 'doc')
        - file: Uploaded file
        - JWT token
    Output: Dict containing status and created summary
    Raises: HTTPException if file processing fails
    """
    try:
        summary_data = Summary(
            userId=userId,
            type=type,
            uploadType=uploadType,
        )
        res = await service_process_file(file, summary_data)
        return {"status": "OK", "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Summary Operations Routes    
@router.delete("/summary/{summary_id}", status_code=status.HTTP_201_CREATED)
async def delete_summary(summary_id: str, _ = Depends(verify_token)):
    """
    Deletes a specific summary and its associated file
    Input: summary_id (str), JWT token
    Output: Dict containing status and deletion confirmation
    Raises: HTTPException if deletion fails
    """
    try:
        res = service_delete_summary(summary_id)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
@router.post("/summary/regenerate/{summary_id}", status_code=status.HTTP_201_CREATED)
async def regenerate_summary(
    summary_id: str, 
    feedback: str = Body(...),
    _ = Depends(verify_token)
):
    """
    Regenerates a summary based on user feedback
    Input: 
        - summary_id (str): ID of summary to regenerate
        - feedback (str): User feedback for regeneration
        - JWT token
    Output: Dict containing status and regenerated summary
    Raises: HTTPException if regeneration fails
    """
    try:
        res = service_regenrate_summary(summary_id, feedback)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

# File Operations Routes
@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """
    Streams the original file for download
    Input: file_id (str)
    Output: StreamingResponse containing the file
    Raises: HTTPException if file not found or download fails
    """
    try:
        res = service_download_file(file_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Sharing Routes    
@router.post("/summary/share", status_code=status.HTTP_200_OK)
async def share_summary(summary_id: str = Body(...), recipient: str = Body(...), _ = Depends(verify_token)):
    """
    Shares a summary with another user via email
    Input: 
        - summary_id (str): ID of summary to share
        - recipient (str): Email of recipient
        - JWT token
    Output: Dict containing status and sharing confirmation
    Raises: HTTPException if sharing fails
    """
    try:
        res = service_share_summary(summary_id, recipient)
        print(res)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
@router.get("/user/{user_id}/shared-summaries", status_code=status.HTTP_200_OK)
async def get_shared_summaries(user_id: str, _ = Depends(verify_token)):
    """
    Retrieves all summaries shared with the user
    Input: user_id (str), JWT token
    Output: Dict containing status and list of shared summaries
    Raises: HTTPException if fetch fails
    """
    try:
        summaries = service_get_shared_summaries(user_id)
        return {"status": "OK", "result": summaries}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch shared summaries")
    
@router.get("/summary/{summary_id}", status_code=status.HTTP_200_OK)
async def get_summary(summary_id: str, _ = Depends(verify_token)):
    """
    Retrieves a specific summary by ID
    Input: summary_id (str), JWT token
    Output: Dict containing status and summary details
    Raises: HTTPException if summary not found
    """
    try:
        res = service_get_summary(summary_id)
        return {"status": "OK", "result": res}
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    
