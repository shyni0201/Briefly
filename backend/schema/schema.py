import datetime

def user_serialiser(object) -> dict:
    """
    Serializes a single user object from MongoDB to a dictionary
    Input: MongoDB user document
    Output: Dictionary containing user details with string-formatted values
    """
    return {
        "id": str(object["_id"]),
        "firstName": str(object["firstName"]),
        "lastName": str(object["lastName"]),
        "phone": str(object["phone"]),
        "email": str(object["email"]),
        "createdAt": str(object["createdAt"]),
        "lastLoggedInAt": str(object["lastLoggedInAt"])
    }

def user_list_serialiser(objects) -> list:
    """
    Serializes a list of user objects
    Input: List of MongoDB user documents
    Output: List of serialized user dictionaries
    """
    return [user_serialiser(object) for object in objects]

def summary_serialiser(object) -> dict:
    """
    Serializes a single summary object from MongoDB to a dictionary
    Input: MongoDB summary document
    Output: Dictionary containing summary details with string-formatted values
            Includes optional file data if present
    """
    serialized_data =  {
        "id": str(object["_id"]),
        "userId": str(object["userId"]),
        "type": str(object["type"]),
        "uploadType": str(object["uploadType"]),
        "initialData": str(object["initialData"]),
        "outputData": str(object["outputData"]),
        "createdAt": str(object["createdAt"]),
        "title": str(object["title"])
    }

    # Add file-related fields if filedata exists
    if "filedata" in object and object["filedata"]:
        serialized_data["fileName"] = object["filedata"].get("filename", None)
        serialized_data["fileId"] = object["filedata"].get("file_id", None)
    
    return serialized_data

def summary_list_serialiser(objects) -> list:
    """
    Serializes a list of summary objects
    Input: List of MongoDB summary documents
    Output: List of serialized summary dictionaries
    """
    return [summary_serialiser(object) for object in objects]

def shared_summary_serialiser(record: dict, summary: dict, sender: dict) -> dict:
    """
    Serialize a shared summary including all necessary fields from both collections.
    
    :param record: The shared summary record from `shared_summaries` collection
    :param summary: The corresponding summary document from `summaries` collection
    :param sender: The user document of the sender from `users` collection
    :return: Serialized shared summary as a dictionary
    """
    # Format the shared_at date or use fallback
    shared_at = record.get("shared_at", datetime.datetime.now())
    
    serialized_data = {
        "id": str(summary["_id"]),
        "title": summary.get("title", "Untitled Summary"),
        "type": summary.get("type", "Unknown Type"),
        "outputData": summary.get("outputData", "No content available"),
        "initialData": summary.get("initialData", "No initial data available"),
        "sharedBy": sender.get("email", "Unknown"),
        "uploadType": str(summary["uploadType"]),
        "sharedAt": datetime.datetime.strftime(
            shared_at, "%B %d, %Y"
        ) if isinstance(shared_at, datetime.datetime) else "Invalid Date",
        "createdAt": summary.get("createdAt", "Unknown Date")
    }

    # Add file-related fields if filedata exists
    if "filedata" in summary and summary["filedata"]:
        serialized_data["fileName"] = summary["filedata"].get("filename", None)
        serialized_data["fileId"] = summary["filedata"].get("file_id", None)
    return serialized_data