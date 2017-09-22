# Jincor Verification Service
![Jincor logo](https://raw.githubusercontent.com/JincorTech/backend-verify/master/Logo.png)

# Jincor VERIFY Service

Jincor Verification is a service for verify users email, phone, and etc.
The main responsibilities are:
1. Interact with a service provider
1. Validation of a received code

Take a look at our [Wiki](wiki) for more details.

API Endpoints Summary

JWT_TOKEN should be passed for every API call in the HTTP headers,
that was received from auth service.

1. `/methods/{METHOD}/actions/initiate [POST]`
1. `/methods/{METHOD}/verifiers/{VERIFICATION_ID}/actions/validate [POST]`
1. `/methods/{METHOD}/verifiers/{VERIFICATION_ID} [DELETE]`
