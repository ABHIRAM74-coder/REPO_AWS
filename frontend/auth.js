
import { Amplify } from "aws-amplify";

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: "ap-southeast-2_VKVaYXCdI",
            userPoolClientId: "7rncn60rvmk14o3gdn598fu6kl",
            loginWith: {
                email: true
            },
            signUpVerificationMethod: "code"
        }
    }
});
