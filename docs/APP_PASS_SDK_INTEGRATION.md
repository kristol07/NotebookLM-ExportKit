# App Pass SDK

This SDK facilitates integration with App Pass for Chrome Extensions.
It provides methods to check App Pass status and activate App Pass.
For more information, see https://joinapppass.com/.

## Installation

```bash
npm install @chrome-stats/app-pass-sdk
```

## Usage

### Check App Pass Status

To check if the user has a valid App Pass:

```typescript
import { checkAppPass } from '@chrome-stats/app-pass-sdk';

const response = await checkAppPass();
if (response.status === 'ok') {
  console.log('App Pass is valid');
} else {
  console.log('App Pass invalid:', response.message);
}
```

### Activate App Pass

To initiate the activation flow (requests permissions and opens activation page):

```typescript
import { activateAppPass } from '@chrome-stats/app-pass-sdk';

const response = await activateAppPass();
```

### Manage App Pass

To open the App Pass management page:

```typescript
import { manageAppPass } from '@chrome-stats/app-pass-sdk';

await manageAppPass();
```

### Server-Side Verification

If you need to verify the App Pass status on your server (e.g., to unlock premium features in your backend), follow these steps:

1. **Retrieve Token**: On the client side (extension), obtain the `appPassToken` from the `checkAppPass()` response. This token is available only when `status` is `'ok'`.

```typescript
const response = await checkAppPass();
if (response.status === 'ok' && response.appPassToken) {
  // Send response.appPassToken to your server
}
```

2. **Verify Token**: On your server, make a GET request to the App Pass API to validate the token.

- **Endpoint**: `https://joinapppass.com/api/check-app-pass`
- **Method**: `GET`
- **Headers**:
  - `app-pass-token`: The token received from the client.

**Example (Node.js/fetch)**:

```typescript
const response = await fetch('https://joinapppass.com/api/check-app-pass', {
  method: 'GET',
  headers: {
    'app-pass-token': receivedAppPassToken
  }
});

const data = await response.json();
if (data.status === 'ok') {
  console.log('User is verified:', data.email);
}
```

## Extension Integration Notes

- Add `@chrome-stats/app-pass-sdk` to dependencies.
- Include `https://joinapppass.com/*` in the extension `host_permissions`.
- Call `checkAppPass()` on load to cache status, and use `activateAppPass()` / `manageAppPass()` from UI actions.
