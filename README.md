# passwordless-login-via-notification

Passwords sucks!

## Flowchart

The flow is the same as the method called "[magic link](https://hackernoon.com/magic-links-d680d410f8f7)" except login request is sent by push notification instead of email.

![public/images/flowchart.jpg](public/images/flowchart.jpg)

## Security

Disclaimer: When I made this demo I just wanted to test this concept as soon as possible so I didn't do a lot of security checks.   
Here is a list of tips for when you make your own implementation:

- Passwordless login should be optional.
- Only one phone can be registered as trusted.
- Activation should be done on the phone that user will use to authorize requests.
- User should confirm that he has a lock screen.
- You must show infos about the device that are trying to login so user can identify.
- There should be a time limit for user to authorize the request.
- When request is answered (allowed or blocked) or time limit is reached, it should be discarded and no longer can be valid.
- Help user in case of intrusion attempt.
- Block multiple login requests from the same device.

## Start this demo

```
git clone https://github.com/iagobruno/passwordless-login-via-notification.git
cd passwordless-login-via-notification
yarn install
node server.js
```

>  I used several new JavaScript features, so run in an updated browser.

## Screenshots

|      |      |      |      |      |      |
| ---- | ---- | ---- | ---- | ---- | ---- |
|![](public/images/username-field-screen.png)|![](public/images/waiting-screen.png)|![](public/images/notification.png)|![](public/images/ask-screen.png)|![](public/images/successfully-screen.png)|![](public/images/blocked-screen.png)|
