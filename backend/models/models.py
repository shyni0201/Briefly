import datetime
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict
from pydantic_extra_types import phone_numbers
import uuid

class User(BaseModel):
    """
    User model representing application users with authentication and contact details.
    All fields are optional to support flexible user registration flows.
    """
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[phone_numbers.PhoneNumber] = None  # Validates phone number format
    email: Optional[EmailStr] = None                   # Validates email format
    password: Optional[str] = None
    confirmPassword: Optional[str] = None
    createdAt: datetime.datetime = datetime.datetime.now(datetime.UTC)
    lastLoggedInAt: datetime.datetime = datetime.datetime.now(datetime.UTC)

    @validator('confirmPassword')
    def passwords_match(cls, confirmPassword, values):
        """
        Validates that the confirmation password matches the original password.
        Raises ValueError if passwords don't match.
        """
        password = values.get('password')
        if password and confirmPassword and confirmPassword != password:
            raise ValueError('Passwords do not match')
        return confirmPassword
    
class Summary(BaseModel):
    """
    Summary model for storing document processing results and metadata.
    Tracks the lifecycle of document uploads and their processed outputs.
    """
    userId: str                                        # Reference to the user who created the summary
    type: str                                         # Type of summary or processing
    uploadType: str                                   # Method or format of upload
    title: Optional[str] = None                       # User-provided title for the summary
    initialData: Optional[str] = None                 # Original input data
    filedata: Optional[Dict[str, str]] = None         # Additional file metadata or content
    outputData: Optional[str] = None                  # Processed/transformed data
    createdAt: datetime.datetime = datetime.datetime.now(datetime.UTC)
    updatedAt: datetime.datetime = datetime.datetime.now(datetime.UTC)
