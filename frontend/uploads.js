
import "./auth.js";

import {
    getCurrentUser,
    fetchAuthSession,
    signOut
} from "aws-amplify/auth";

const API_URL =
    "https://xqimnu31p5.execute-api.ap-southeast-2.amazonaws.com/upload-url";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
    "pdf", "doc", "docx",
    "ppt", "pptx",
    "xls", "xlsx",
    "png", "jpg", "jpeg"
];

const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const uploadMessage = document.getElementById("uploadMessage");
const logoutBtn = document.getElementById("logoutBtn");

let authenticated = false;

function showMessage(message) {
    uploadMessage.textContent = message;
}

// Verify Cognito login
async function checkAuthentication() {
    try {
        await getCurrentUser();

        const session = await fetchAuthSession();

        if (!session.tokens?.accessToken) {
            throw new Error("Session expired");
        }

        authenticated = true;
        uploadBtn.disabled = false;
        logoutBtn.disabled = false;

    } catch {
        window.location.replace("/");
    }
}

// Upload file
uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!authenticated) {
        showMessage("Please login first.");
        return;
    }

    const file = fileInput.files[0];

    if (!file) {
        showMessage("Please select a file.");
        return;
    }

    const extension = file.name.split(".").pop().toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        showMessage("Unsupported file type.");
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        showMessage("Maximum file size is 100 MB.");
        return;
    }

    uploadBtn.disabled = true;
    showMessage("Preparing upload...");

    try {
        const session = await fetchAuthSession();

        const token = session.tokens?.accessToken?.toString();

        if (!token) {
            throw new Error("Please login again.");
        }

        // Request a presigned URL from Python Lambda
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                filename: file.name,
                fileSize: file.size,
                contentType: file.type || "application/octet-stream"
            })
        });

        if (!response.ok) {
            throw new Error(
                `API Gateway error: ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.uploadUrl || !data.contentType) {
            throw new Error("Invalid Lambda response.");
        }

        // Upload directly to S3 using Lambda's signed URL
        showMessage("Uploading file to S3...");

        const s3Response = await fetch(data.uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": data.contentType
            },
            body: file
        });

        if (!s3Response.ok) {
            throw new Error(
                `S3 upload failed: ${s3Response.status}`
            );
        }

        showMessage("File uploaded successfully!");
        uploadForm.reset();

    } catch (error) {
        console.error(error);
        showMessage(error.message || "Upload failed.");

    } finally {
        uploadBtn.disabled = false;
    }
});

// Logout
logoutBtn.addEventListener("click", async () => {
    await signOut();
    window.location.replace("/");
});

uploadBtn.disabled = true;
logoutBtn.disabled = true;

checkAuthentication();
