
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        message.textContent = "Please enter email and password.";
        return;
    }

    message.textContent =
        "Login page is ready. AWS Cognito connection is pending.";
});
