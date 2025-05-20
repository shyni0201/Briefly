import uuid
import os
from dotenv import load_dotenv
from models.models import User, Summary
from config.database import users_collection_name, summaries_collection_name, grid_fs, shared_summaries_collection_name
from schema.schema import *
from exceptions import ServiceError, NotFoundError, ValidationError
from gridfs import GridFS
from PyPDF2 import PdfReader
import json
import datetime
import jwt
from fastapi import HTTPException, UploadFile
import re
from fastapi import UploadFile
from fastapi.responses import StreamingResponse
from bson import ObjectId
from mistralai import Mistral
from config.database import grid_fs
from bson import ObjectId
from io import BytesIO
from docx import Document
import examples.code_summary_examples as code_examples
from services.utils import extract_text_from_pdf, clean, get_all_examples_for_language, regenerate_feedback, extract_text_from_file
from services.calls_to_ai import complete_chat, call_to_AI, regenerate_chat_response, prompts
# Load environment variables
load_dotenv()

# Replace hardcoded values with environment variables
SECRET_KEY = os.getenv('SECRET_KEY')
api_key = os.getenv('MISTRAL_API_KEY')

if not SECRET_KEY or not api_key:
    raise ValueError("Missing required environment variables. Please check your .env file.")

# Authentication functions
def create_access_token(data: dict, expires_delta: datetime.timedelta):
    """
    Creates a JWT token with expiration.
    
    Args:
        data (dict): Data to encode in the token
        expires_delta (datetime.timedelta): Token expiration time
    
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

# User management functions
def service_create_new_user(user: User):
    """
    Creates a new user if email and phone are unique.
    
    Args:
        user (User): User object containing email, phone, and other details
    
    Returns:
        dict: Message and userId of created user
    
    Raises:
        ServiceError: If user already exists
    """
    # Check for existing user to prevent duplicates
    existing_user = users_collection_name.find_one({'email': user.email, 'phone': user.phone})
    if existing_user:
        raise ServiceError("User Already Exists", status_code=409)

    # Generate unique ID and insert user
    user_data = dict(user)
    user_data['_id'] = str(uuid.uuid4())
    users_collection_name.insert_one(user_data)
    return {"message": "User created successfully", "userId": user_data['_id']}

def service_verify_user(obj: User) -> dict:
    """Verifies user credentials and returns auth token"""
    # Find user by email
    user = users_collection_name.find_one({'email': obj.email})
    if user is None:
        raise NotFoundError("Account Does Not Exist")
    
    # Generate JWT token
    token_expires = datetime.timedelta(days=30)
    token = create_access_token(
        data={"userId": user['_id']}, expires_delta=token_expires
    )

    user_dict = user_serialiser(user)
    return {'auth_token': token, 'user': user_dict}  

# Summary management functions
def service_user_summaries(userId: str) -> list:
    """Retrieves all summaries for a user, sorted by creation date"""
    # Query and sort summaries
    summaries = summaries_collection_name.find({'userId': userId}).sort("createdAt", -1)
    summary_list = summary_list_serialiser(summaries)
    if not summary_list:
        return []
    return summary_list

def service_create_summary(summary: Summary):
    """Creates a new summary using AI processing"""
    summary_data = dict(summary)
    # Process through AI
    outputData = call_to_AI(summary_data['type'],summary_data['initialData'])
    summary_data['outputData'] = outputData['Summary']
    summary_data['title'] = outputData['Title']   
    
    # Save to database
    summary_data['_id'] = str(uuid.uuid4())
    summaries_collection_name.insert_one(summary_data)
    return {"message": "Summary created successfully", "summary_id": summary_data['_id']}

async def service_process_file(file: UploadFile, summary: Summary):
    """
    Processes uploaded file, stores it in GridFS, and generates summary.
    
    Args:
        file (UploadFile): The uploaded file object
        summary (Summary): Summary object containing metadata
    
    Returns:
        dict: Contains message, summary_id, and file_id
    
    Raises:
        ServiceError: If file processing fails
    """
    # Read file contents into memory
    file_contents = await file.read()

    # Store file metadata for later retrieval
    metadata = {
        "filename": file.filename,
        "content_type": file.content_type,
    }

    # Store file in GridFS with metadata
    file_id = grid_fs.put(
        file_contents,
        filename=metadata["filename"],
        content_type=metadata["content_type"]
    )

    # Update metadata with GridFS ID
    metadata["file_id"] = str(file_id)
    summary.filedata = metadata

    # Extract text and generate summary
    initialData = extract_text_from_file(file, file_contents)
    summary_data = dict(summary)
    outputData = call_to_AI(summary_data['type'], initialData)
    summary_data['outputData'] = outputData['Summary']
    summary_data['title'] = outputData['Title']  

    # Generate unique ID and save summary
    summary_data['_id'] = str(uuid.uuid4())
    summaries_collection_name.insert_one(summary_data)

    return {"message": "Summary created successfully", "summary_id": summary_data['_id'], "file_id": str(file_id)}

def service_delete_summary(summary_id: str):
    """Deletes a summary and its associated file from GridFS"""
    # Find summary
    summary = summaries_collection_name.find_one({"_id": summary_id})
    if not summary:
        raise ValueError("Summary not found")

    # Delete associated file if exists
    if "filedata" in summary and summary["filedata"]:
        file_id = summary["filedata"].get("file_id") 
        if file_id:
            grid_fs.delete(file_id)

    # Delete summary
    summaries_collection_name.delete_one({"_id": summary_id})
    return {"message": "Summary deleted successfully"}

def service_regenrate_summary(summary_id: str, feedback: str):
    """Regenerates a summary based on user feedback"""
    # Find existing summary
    summary = summaries_collection_name.find_one({"_id": summary_id})
    if not summary:
        raise NotFoundError("Summary not found")

    # Process feedback and update
    summary_data = dict(summary)
    outputData = regenerate_feedback(summary_data, feedback)
    summary_data['outputData'] = outputData['Summary']
    summary_data['title'] = outputData['Title']
    summaries_collection_name.update_one({"_id": summary_id}, {"$set": summary_data})
    return {"message": "Summary regenerated successfully"}

def service_share_summary(summary_id: str, recipient: str):
    """
    Shares a summary with another user.
    
    Args:
        summary_id (str): ID of the summary to be shared
        recipient (str): Email address of the recipient
    
    Returns:
        dict: Success message with recipient info
    
    Raises:
        NotFoundError: If summary or recipient doesn't exist
        ServiceError: If sharing fails or user tries to share with themselves
    """
    try:
        # Verify summary exists
        summary = summaries_collection_name.find_one({"_id": summary_id})
        if not summary:
            raise NotFoundError("Summary not found")

        # Verify recipient exists
        recipient_user = users_collection_name.find_one({"email": recipient})
        if not recipient_user:
            raise NotFoundError("The recipient must be a registered user of Briefly.")

        # Prevent self-sharing
        if summary["userId"] == recipient_user["_id"]:
            raise ServiceError("You cannot share a summary with yourself.")

        # Create sharing record
        shared_record = {
            "_id": str(uuid.uuid4()),
            "summary_id": summary_id,
            "sender_id": summary["userId"],
            "recipient_id": recipient_user["_id"],
            "shared_at": datetime.datetime.now(),
        }
     
        # Save sharing record
        shared_summaries_collection = summaries_collection_name.database["shared_summaries"]
        # Check if the summary is already shared with the same recipient
        existing_share = shared_summaries_collection.find_one({
                     "summary_id": shared_record["summary_id"],
                 "recipient_id": shared_record["recipient_id"]})

        if existing_share:
            # If the summary is already shared with the recipient, return a message
            return {"message": f"Summary already shared with {recipient}"}
        
        shared_summaries_collection.insert_one(shared_record)

        return {"message": f"Summary shared successfully with {recipient}"}

    except NotFoundError as e:
        raise NotFoundError(e.detail)
    except Exception as e:
        raise ServiceError(f"Failed to share summary: {str(e)}")
    
def service_get_shared_summaries(user_id: str):
    """
    Fetches all summaries shared with a specific user.
    
    Args:
        user_id (str): ID of the user to fetch shared summaries for
    
    Returns:
        list: List of shared summaries with sender information
    
    Raises:
        ServiceError: If fetching shared summaries fails
    """
    try:
        # Query shared summaries
        shared_records = shared_summaries_collection_name.find({"recipient_id": user_id}).sort("shared_at", -1)
        
        result = []
        for shared_record in shared_records:
            # Get original summary
            summary = summaries_collection_name.find_one({"_id": shared_record["summary_id"]})
            if not summary:
                continue

            # Get sender info
            sender = users_collection_name.find_one({"_id": shared_record["sender_id"]})
            if not sender:
                continue

            # Format data
            shared_summary = shared_summary_serialiser(shared_record, summary, sender)
            result.append(shared_summary)

        return result

    except Exception as e:
        raise ServiceError(f"Failed to fetch shared summaries: {str(e)}")

def service_get_summary(summary_id: str):
    """
    Retrieves a specific summary by ID.
    
    Args:
        summary_id (str): ID of the summary to retrieve
    
    Returns:
        dict: Serialized summary object
    
    Raises:
        ValueError: If summary not found
    """
    summary = summaries_collection_name.find_one({"_id": summary_id})
    if not summary:
        raise ValueError("Summary not found")
    summary = summary_serialiser(summary)
    return summary

def service_download_file(file_id: str):
    """
    Streams file from GridFS for download.
    
    Args:
        file_id (str): GridFS ID of the file to download
    
    Returns:
        StreamingResponse: File stream with appropriate headers
    
    Raises:
        HTTPException: If file not found (404)
    """
    try:
        # Retrieve file from GridFS
        grid_out = grid_fs.get(ObjectId(file_id))
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

    # Create async generator for streaming file contents
    async def file_iterator():
        while chunk := grid_out.read(1024 * 1024):  # Read in 1MB chunks
            yield chunk

    # Return streaming response with appropriate headers
    return StreamingResponse(
        file_iterator(),
        media_type=grid_out.content_type,
        headers={"Content-Disposition": f"attachment; filename={grid_out.filename}"}
    )