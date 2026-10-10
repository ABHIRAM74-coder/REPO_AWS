
import json
import os
import uuid
import re
import boto3
from botocore.config import Config

s3 = boto3.client(
    "s3",
    region_name=os.environ.get("AWS_REGION", "ap-southeast-2"),
    config=Config(signature_version="s3v4")
)

BUCKET_NAME = os.environ["BUCKET_NAME"]
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB

ALLOWED_TYPES = {
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg"
}


def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(body)
    }


def lambda_handler(event, context):
    try:
        # This endpoint must be protected by an
        # API Gateway Cognito JWT authorizer.
        claims = (
            event.get("requestContext", {})
                 .get("authorizer", {})
                 .get("jwt", {})
                 .get("claims", {})
        )

        user_id = claims.get("sub")

        if not user_id:
            return response(401, {
                "error": "Authentication required"
            })

        body = json.loads(event.get("body") or "{}")

        filename = body.get("filename", "")
        file_size = body.get("fileSize", 0)

        if not isinstance(filename, str) or not filename:
            return response(400, {
                "error": "Invalid filename"
            })

        if not isinstance(file_size, int) or not 0 < file_size <= MAX_FILE_SIZE:
            return response(400, {
                "error": "Invalid file size"
            })

        extension = filename.rsplit(".", 1)[-1].lower()

        if extension not in ALLOWED_TYPES:
            return response(400, {
                "error": "Unsupported file type"
            })

        content_type = ALLOWED_TYPES[extension]

        # Keep the S3 object name safe and unique.
        safe_name = re.sub(
            r"[^a-zA-Z0-9._-]",
            "_",
            filename.split("/")[-1].split("\\")[-1]
        )[:120]

        object_key = (
            f"users/{user_id}/"
            f"{uuid.uuid4().hex}_{safe_name}"
        )

        upload_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": object_key,
                "ContentType": content_type
            },
            ExpiresIn=300
        )

        return response(200, {
            "uploadUrl": upload_url,
            "contentType": content_type,
            "objectKey": object_key
        })

    except (ValueError, TypeError, json.JSONDecodeError):
        return response(400, {
            "error": "Invalid request"
        })

    except Exception as error:
        print("Upload preparation failed:", str(error))
        return response(500, {
            "error": "Internal server error"
        })
