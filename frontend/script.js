
import "./auth.js";

import {
    signUp,
    confirmSignUp,
    signIn,
    getCurrentUser,
    fetchAuthSession
} from "aws-amplify/auth";

// HTML elements
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const verifyForm = document.getElementById("verifyForm");
const accountSection = document.getElementById("accountSection");
const message = document.getElementById("message");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

let pendingEmail = "";

// Display only the selected section
function showSection(section) {
    [
        loginForm,
        signupForm,
        verifyForm,
        accountSection
    ].forEach(element => {
        if (element) {
            element.hidden = element !== section;
        }
    });

    if (message) {
        message.textContent = "";
    }
}

// Display messages
function showMessage(text) {
    if (message) {
        message.textContent = text;
    }
}

// Show signup form
showSignup.addEventListener("click", (event) => {
    event.preventDefault();
    showSection(signupForm);
});

// Show login form
showLogin.addEventListener("click", (event) => {
    event.preventDefault();
    showSection(loginForm);
});

// SIGN UP
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document
        .getElementById("signupEmail")
        .value.trim();

    const password = document
        .getElementById("signupPassword")
        .value;

    try {
        const result = await signUp({
            username: email,
            password: password,
            options: {
                userAttributes: {
                    email: email
                }
            }
        });

        pendingEmail = email;

        if (
            result.nextStep?.signUpStep ===
            "CONFIRM_SIGN_UP"
        ) {
            showSection(verifyForm);
            showMessage(
                "Verification code sent to your email."
            );
        } else if (result.isSignUpComplete) {
            showSection(loginForm);
            showMessage(
                "Account created. Please log in."
            );
        }

    } catch (error) {
        showMessage(
            error.message || "Sign up failed."
        );
    }
});

// VERIFY EMAIL
verifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code = document
        .getElementById("verifyCode")
        .value.trim();

    try {
        await confirmSignUp({
            username: pendingEmail,
            confirmationCode: code
        });

        document.getElementById(
            "loginEmail"
        ).value = pendingEmail;

        showSection(loginForm);
        showMessage(
            "Email verified! Please log in."
        );

    } catch (error) {
        showMessage(
            error.message || "Verification failed."
        );
    }
});

// LOGIN
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document
        .getElementById("loginEmail")
        .value.trim();

    const password = document
        .getElementById("loginPassword")
        .value;

    try {
        const result = await signIn({
            username: username,
            password: password
        });

        if (result.isSignedIn) {
            window.location.replace("/uploads.html");
            return;
        }

        showMessage(
            "Additional authentication required: " +
            (result.nextStep?.signInStep || "Unknown")
        );

    } catch (error) {
        showMessage(
            error.message || "Login failed."
        );
    }
});

// RESTORE EXISTING LOGIN SESSION
async function checkSession() {
    try {
        await getCurrentUser();

        const session = await fetchAuthSession();

        if (!session.tokens?.accessToken) {
            throw new Error("No active session");
        }

        // Already logged in: go directly to upload page
        window.location.replace("/uploads.html");

    } catch {
        // Not logged in: show login form
        showSection(loginForm);
    }
}

// Start with the login form hidden until session check
showSection(loginForm);
loginForm.hidden = true;

// Check login session when page loads
checkSession();
