# Jincor Verification Service
![](https://habrastorage.org/webt/59/d5/42/59d542206afbe280817420.png)

# Jincor VERIFY Service

Jincor Verification is a service for verification of users emails, phones, and so on.

The main responsibilities are:
1. Interact with a service provider (mailgun)
1. Validation of a received code
1. Storing the status of verification

Take a look at our [Wiki](../../wiki) and [API DOCS](https://jincortech.github.io/backend-verify/) for more details.

API Endpoints Summary

JWT_TOKEN should be passed for every API call in the HTTP headers,
that was received from auth service.

1. `/methods/{METHOD}/actions/initiate [POST]`
1. `/methods/{METHOD}/verifiers/{VERIFICATION_ID}/actions/validate [POST]`
1. `/methods/{METHOD}/verifiers/{VERIFICATION_ID} [DELETE]`
