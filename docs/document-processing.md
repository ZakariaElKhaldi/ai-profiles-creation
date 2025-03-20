# Document Processing

This guide explains how to upload and process documents in the AI Profiles system, which provides context for your AI profiles.

## Supported Document Types

The system supports the following document types:
- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Plain text (`.txt`)
- CSV spreadsheets (`.csv`) 
- Excel spreadsheets (`.xlsx`)

## Document Upload

Documents can be uploaded through the web interface or via the API.

### Web Interface Upload

1. Navigate to the profile you want to add documents to
2. Select the "Uploads" tab
3. Drag and drop files or click to select files
4. Wait for the upload to complete

Multiple files can be uploaded at once.

### API Upload

Documents can be uploaded programmatically using the API:

```
POST /api/documents
Content-Type: multipart/form-data

file: [The document file]
profile_id: [ID of the profile to associate with]
title: [Document title]
document_type: [pdf|docx|txt|csv|xlsx]
```

Example using `curl`:

```bash
curl -X POST "http://localhost:8000/api/documents" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  -F "profile_id=a2fbbd28-dbec-4cfb-8fba-382fd124d290" \
  -F "title=My Document" \
  -F "document_type=pdf"
```

Example using Python:

```python
import requests

def upload_document(file_path, profile_id, title=None):
    url = "http://localhost:8000/api/documents"
    
    # Determine file type from extension
    file_extension = file_path.split('.')[-1].lower()
    document_type_map = {
        'pdf': 'pdf',
        'docx': 'docx',
        'txt': 'txt',
        'csv': 'csv',
        'xlsx': 'xlsx'
    }
    document_type = document_type_map.get(file_extension, 'pdf')
    
    # Use filename as title if not provided
    if title is None:
        title = file_path.split('/')[-1]
    
    # Create form data
    files = {'file': open(file_path, 'rb')}
    data = {
        'profile_id': profile_id,
        'title': title,
        'document_type': document_type
    }
    
    # Upload the document
    response = requests.post(url, files=files, data=data)
    
    return response.json()
```

## Document Processing Pipeline

After upload, documents go through a processing pipeline:

1. **Upload**: Document is received and saved to disk
2. **Validation**: Document type is checked and file is verified
3. **Extraction**: Text and metadata are extracted from the document
4. **Storage**: Extracted content is stored for later use
5. **Profile Association**: Document ID is added to the profile's `document_ids` list
6. **Status Update**: Document status is marked as "completed"

The document status will be one of:
- `pending`: Document has been received but not processed
- `processing`: Document is being processed
- `completed`: Document has been successfully processed
- `failed`: Document processing failed

## Document Content Extraction

Different document types are processed as follows:

- **PDF**: Text is extracted from each page, along with metadata like author, creation date, page count
- **DOCX**: Text is extracted from the document
- **TXT**: Content is read directly
- **CSV**: Data is converted to text format
- **XLSX**: Each sheet is converted to text format

## Viewing Documents

You can view all documents associated with a profile in the "Documents" tab of the profile view. This shows:
- Document title
- Upload date
- Document type
- Processing status
- Size
- Page count (for applicable document types)

## Document to Profile Association

> ⚠️ **Note**: Prior to version 1.2.0, there was a known issue where documents were not properly associated with profiles in the database. This has been fixed, but you may need to run a maintenance task to associate existing documents.

Documents are associated with profiles through the `document_ids` array in the profile object. This association happens automatically when a document is successfully processed.

If you're experiencing issues where documents are visible in the system but not included in AI responses, you may need to run the document synchronization endpoint:

```
POST /api/documents/sync-with-profiles
```

This will update all profiles with their corresponding document IDs.

## Deleting Documents

To delete a document:
1. Navigate to the "Documents" tab of the profile
2. Find the document you want to delete
3. Click the "Delete" button
4. Confirm the deletion

Via API:
```
DELETE /api/documents/{document_id}
```

## Troubleshooting

### Upload Fails

If document upload fails, check:
- The file is not corrupted
- The file is within the size limit (50MB by default)
- The file type is supported
- You have permission to upload to the specified profile

### Document Processing Fails

If document processing fails, check:
- The document is not password-protected
- The document is not corrupted
- For PDFs, ensure they are text-based and not scanned images
- For XLSX/CSV, ensure they don't contain complex formatting or macros

### Documents Not Appearing in AI Responses

If documents are not being included in AI responses:
1. Check that the document status is "completed" in the "Documents" tab
2. Verify that the document IDs are in the profile's `document_ids` array
3. If not, run the document synchronization endpoint:
   ```
   POST /api/documents/sync-with-profiles
   ```
4. Try querying the profile again

### "No such file or directory" Errors

If you see errors about missing files, ensure:
- The document has been fully processed (status is "completed")
- The server has not been moved or had files deleted
- The data storage paths in settings are correct 