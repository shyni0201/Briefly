import time
from mistralai import Mistral
import os
api_key = os.getenv('MISTRAL_API_KEY')

# Simple base prompts for different types of content summarization
prompts = {
    'code': "You are a code summarisation tool. Understand the given code and output the detailed summary of the code.",
    'research': "You are a research article summarisation tool. Go through the research article given to you and give a detailed summary. Make sure your summary covers motivation, methodology, experiment results and future improvements.",
    'documentation': "You are a summarisation tool. You will be given a piece of text that you should summarize, make sure to cover as much content as you can. Be as technical as you can be."
}



def complete_chat(client, model, prompts, inputType, example_code_summaries, inputData):
    """
    Completes a chat interaction using the Mistral client.

    Args:
        client (Mistral): The Mistral API client.
        model (str): The model to use for the chat.
        prompts (dict): Dictionary of prompts for different input types.
        inputType (str): The type of input (e.g., 'code', 'research').
        example_code_summaries (list): List of example summaries for the input type.
        inputData (str): The actual content to summarize.

    Returns:
        The chat response from the Mistral API.
    """
    return client.chat.complete(
        model=model,
        messages=[
            {
                "role": "system",
                "content": prompts[inputType],
            },
            {
                "role": "system",
                "content": example_code_summaries[0],
            },
            {
                "role": "user",
                "content": inputData,
            },
            {
                "role": "system",
                "content": "Return the Title and Summary in short json object.",
            }
        ],
        response_format={
            "type": "json_object",
        }
    )

def call_to_AI(input_type, initial_data):
    """Processes input through Mistral AI for summarization"""
    # Import inside the function to avoid circular import issues
    from services.utils import detect_language, get_all_examples_for_language, parse_chat_response

    # Select appropriate model based on content type
    model = "open-mistral-nemo"
    if input_type == "code":
        model = "open-codestral-mamba"

    # Initialize API client
    client = Mistral(api_key=api_key)
    
    # Use the detect_language function to determine the language of the input
    language = detect_language(client, initial_data)

    # Temp  fix to
    time.sleep(2)
    # Fetch all examples for the given input type
    example_code_summaries = get_all_examples_for_language(language)

    # Use the new complete_chat function
    chat_response = complete_chat(client, model, prompts, input_type, example_code_summaries, initial_data)

    # Extract and parse response using the new function
    outputData = parse_chat_response(chat_response)

    return outputData

def regenerate_chat_response(client, model, prompts, input_type, example_code_summaries, initial_data, summary_data, feedback):
    """
    Generates a chat response using the Mistral client for regenerating summaries.

    Args:
        client (Mistral): The Mistral API client.
        model (str): The model to use for the chat.
        prompts (dict): Dictionary of prompts for different input types.
        input_type (str): The type of input (e.g., 'code', 'research').
        example_code_summaries (list): List of example summaries for the input type.
        initial_data (str): The initial data to be summarized.
        summary_data (dict): Original summary data containing type, initial data, and file info.
        feedback (str): User feedback for regenerating the summary.

    Returns:
        The chat response from the Mistral API.
    """
    # Import inside the function to avoid circular import issues
    from services.utils import parse_chat_response

    # ... existing code ...
    chat_response = client.chat.complete(
        model=model,
        messages=[
            {
                "role": "system",
                "content": prompts[input_type]
            },
            {
                "role": "user",
                "content": initial_data
            },
            {
                "role": "user",
                "content": feedback
            }
        ],
        response_format={
            "type": "text"
        }
    )
    outputData = parse_chat_response(chat_response)
    # ... existing code ...

    return outputData