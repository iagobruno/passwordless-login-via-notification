# passwordless-login-via-notification

Passwords sucks!

## Flowchart

The flow is the same as the method called "[magic link](https://hackernoon.com/magic-links-d680d410f8f7)" except login request is sent by push notification instead of email.

![flowchart.jpg](readme_imgs/flowchart.jpg)

## Security

When I made this demo I just wanted to test this concept as soon as possible so I didn't do a lot of security checks, but here is a list of tips for when you make your own implementation:

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

## Screenshots
|      |      |      |      |      |
| ---- | ---- | ---- | ---- | ---- |
|![](readme_imgs/username-field-screen.png)|![](readme_imgs/waiting-screen.png)|![](readme_imgs/notification.png)|![](readme_imgs/ask-screen.png)|![](readme_imgs/successfully-screen.png)|
