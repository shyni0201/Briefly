from PyPDF2 import PdfReader
from io import BytesIO
import re
import json
from bson import ObjectId
from config.database import grid_fs
from docx import Document
import examples.code_summary_examples as code_examples
from mistralai import Mistral
import os
from fastapi import UploadFile
from exceptions import ServiceError, NotFoundError, ValidationError
import time
from services.calls_to_ai import regenerate_chat_response, prompts
# Load environment variables
api_key = os.getenv('MISTRAL_API_KEY')


def extract_text_from_pdf(uploaded_file):
    """
    Extracts text content specifically from PDF files.
    
    Args:
        uploaded_file (UploadFile): PDF file to extract text from
    
    Returns:
        str: Extracted text content from all pages
    """
    text = ""
    pdf_reader = PdfReader(uploaded_file.file)
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        text += page.extract_text()
    return text


# File processing functions
def extract_text_from_file(file: UploadFile, contents: bytes) -> str:
    """
    Extracts text content from various file types.
    
    Args:
        file (UploadFile): File object with filename and content type
        contents (bytes): Raw file contents
    
    Returns:
        str: Extracted text content
    
    Raises:
        ServiceError: If file contents cannot be decoded
    
    Notes:
        Supports PDF, TXT, common code files, DOC/DOCX formats
    """
    try:
        # Handle different file types
        if file.filename.endswith('.pdf'):
            return extract_text_from_pdf(file)
        elif file.filename.endswith(('.txt', '.py', '.js', '.html', '.css', '.json', '.md')):
            return contents.decode('utf-8')
        elif file.filename.endswith(('.doc', '.docx')):
            doc = Document(BytesIO(contents))
            return '\n'.join([paragraph.text for paragraph in doc.paragraphs])
        else:
            return contents.decode('utf-8')
    except UnicodeDecodeError:
        raise ServiceError("Unable to decode file contents", status_code=400)

def clean(data):
    """
    Removes special characters from start and end of string.
    
    Args:
        data (str): String to clean
    
    Returns:
        str: Cleaned string with special characters removed from start and end
    """
    return re.sub(r'^[^\w]+|[^\w]+$', '', data)

def clean_language_prefix(language_prefix):
    """
    Cleans the language prefix by removing any special characters and converting to lowercase.
    
    Args:
        language_prefix (str): The language prefix to clean
    
    Returns:
        str: Cleaned language prefix
    """
    # It could be possible that the language_prefix might have extra content that we dont want, normalize the text, lower case it, remove any special characters
    # Then search for the first occurrence of any of the languages in the list and return that
    language_prefix = clean(language_prefix).lower()
    for language in ['python', 'java', 'c', 'other']:
        if language in language_prefix:
            return language
    return 'other'

def get_all_examples_for_language(language_prefix):
    """
    Fetches all examples for a given language prefix from the code_examples module.
    
    Args:
        language_prefix (str): The prefix of the language (e.g., 'java', 'python', 'c')
    
    Returns:
        list: A list of example strings for the specified language
    """
    language_prefix = clean_language_prefix(language_prefix)
    # Use dir() to list all attributes in the module
    all_examples = dir(code_examples)
    
    # Filter examples based on the language prefix
    language_examples = [
        getattr(code_examples, example) 
        for example in all_examples 
        if example.startswith(language_prefix)
    ]
    
    return language_examples

def detect_language(client, inputData):
    """
    Determines the programming language of the given code using Mistral AI.
    
    Args:
        client (Mistral): The Mistral API client.
        inputData (str): The code input to analyze.
    
    Returns:
        str: The detected programming language.
    """
    language_response = client.chat.complete(
        model="open-mistral-nemo",
        messages=[
            {
                "role": "system",
                "content": "You are an expert programmer. You will be given a piece of code by the user. Determine which of the following programming languages the code is written in: Python, Java, CPlusPlus, other. Your output should only be one of [Python, Java, CPlusPlus, Other]."
            },
            {
                "role": "user",
                "content": inputData
            }
        ],
        response_format={
            "type": "text"
        }
    )
    return language_response.choices[0].message.content.strip()

def parse_chat_response(chat_response):
    """
    Parses the chat response to extract JSON data.

    Args:
        chat_response: The response object from the chat API.

    Returns:
        dict: A dictionary containing the parsed JSON data.
    """
    outputData_string = chat_response.choices[0].message.content
    try:
        return json.loads(outputData_string, strict=False)
    except json.JSONDecodeError:
        return handle_json_decode_error(outputData_string)

def handle_json_decode_error(outputData_string):
    """
    Handles JSON decoding errors by attempting to extract summary data.

    Args:
        outputData_string (str): The string to parse.

    Returns:
        dict: A dictionary with extracted summary data.
    """
    outputData = {}
    try:
        summary = clean(outputData_string.split("Summary")[1])
        outputData['Summary'] = summary
    except IndexError:
        outputData['Summary'] = clean(outputData_string)
    return outputData

def regenerate_feedback(summary_data, feedback):
    """
    Regenerates summary based on user feedback using AI.
    
    Args:
        summary_data (dict): Original summary data containing type, initial data, and file info
        feedback (str): User feedback for regenerating the summary
    
    Returns:
        dict: Contains updated 'Title' and 'Summary' based on feedback
    
    Notes:
        - Uses same model selection logic as initial summarization
        - Maintains original title while updating summary
        - Can handle both direct text and file-based summaries
    """
    # Select model based on content type
    inputType = summary_data['type']
    model = "open-mistral-nemo"
    if inputType == "code":
        model = "open-codestral-mamba"

    # Get initial data
    initialData = summary_data['initialData']
    if initialData is None and summary_data['filedata'] is not None:
        filedata = summary_data['filedata']
        file = grid_fs.get(ObjectId(filedata['file_id']))
        file_contents = file.read()
        
        # Create a temporary UploadFile-like object with a file-like interface
        class TempUploadFile:
            def __init__(self, filename, contents):
                self.filename = filename
                self.file = BytesIO(contents)
                
        temp_file = TempUploadFile(filedata['filename'], file_contents)
        initialData = extract_text_from_file(temp_file, file_contents)

    example_code_summaries = get_all_examples_for_language('java')  # Only need formatting, so using java example as default
    # Process through AI
    client = Mistral(api_key=api_key)
    chat_response = regenerate_chat_response(
        client, model, prompts, inputType, example_code_summaries, initialData, summary_data, feedback
    )

    # Process response
    outputData = parse_chat_response(chat_response)
    outputData['Title'] = summary_data['title']
    return outputData