
import { Amplify } from "aws-amplify";

import {
    signUp,
    confirmSignUp,
    signIn,
    signOut,
    getCurrentUser
} from "aws-amplify/auth";

// REPLACE THESE TWO VALUES WITH YOUR COGNITO DETAILS
const USER_POOL_ID = "ap-southeast-2_VKVaYXCdI";
const USER_POOL_CLIENT_ID = "7rncn60rvmk14o3gdn598fu6kl";

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: USER_POOL_ID,
            userPoolClientId: USER_POOL_CLIENT_ID,
            loginWith: {
                email: true
            },
            signUpVerificationMethod: "code"
        }
    }
});

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const verifyForm = document.getElementById("verifyForm");
const accountSection = document.getElementById("accountSection");
const message = document.getElementById("message");

let pendingEmail = "";

function showSection(section) {
    [loginForm, signupForm, verifyForm, accountSection]
        .forEach(element => {
            element.hidden = element !== section;
        });

    message.textContent = "";
}

function showMessage(text) {
    message.textContent = text;
}

document.getElementById("showSignup").onclick = (event) => {
    event.preventDefault();
    showSection(signupForm);
};

document.getElementById("showLogin").onclick = (event) => {
    event.preventDefault();
    showSection(loginForm);
};

// SIGN UP
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("signupEmail")
        .value.trim();

    const password = document.getElementById("signupPassword")
        .value;

    try {
        const result = await signUp({
            username: email,
            password,
            options: {
                userAttributes: {
                    email
                }
            }
        });

        pendingEmail = email;

        if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
            showSection(verifyForm);
            showMessage("Verification code sent to your email.");
        } else if (result.isSignUpComplete) {
            showSection(loginForm);
            showMessage("Account created. Please log in.");
        }
    } catch (error) {
        showMessage(error.message || "Sign up failed.");
    }
});

// VERIFY EMAIL
verifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code = document.getElementById("verifyCode")
        .value.trim();

    try {
        await confirmSignUp({
            username: pendingEmail,
            confirmationCode: code
        });

        document.getElementById("loginEmail").value = pendingEmail;

        showSection(loginForm);
        showMessage("Email verified! Please log in.");
    } catch (error) {
        showMessage(error.message || "Verification failed.");
    }
});

// LOGIN
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("loginEmail")
        .value.trim();

    const password = document.getElementById("loginPassword")
        .value;

    try {
        const result = await signIn({
            username,
            password
        });

        if (result.isSignedIn) {
            showSection(accountSection);
            showMessage("Login successful!");
        } else {
            showMessage(
                "Additional authentication required: " +
                result.nextStep.signInStep
            );
        }
    } catch (error) {
        showMessage(error.message || "Login failed.");
    }
});

// LOGOUT
document.getElementById("logoutBtn")
    .addEventListener("click", async () => {
        try {
            await signOut();
            showSection(loginForm);
            showMessage("Logged out successfully.");
        } catch (error) {
            showMessage(error.message || "Logout failed.");
        }
    });

// RESTORE LOGIN SESSION
async function checkSession() {
    try {
        await getCurrentUser();
        showSection(accountSection);
    } catch {
        showSection(loginForm);
    }
}

checkSession();
