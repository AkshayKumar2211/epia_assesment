# WhatsApp API Error Diagnosis

## Error received

```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException",
    "code": 190
  }
}
```

## 1. Most likely cause

Error code **190** from the Meta Graph API means the access token used in the request is invalid. This typically happens because:

- The token has **expired** — Meta user tokens have a short lifespan (about 1 hour for short-lived tokens, ~60 days for long-lived tokens). System User tokens for the WhatsApp Business API are long-lived but can still be invalidated.
- The token was **revoked** — e.g. a password change on the associated Facebook account, app permissions were removed, or the token was manually invalidated.
- The token is **malformed** — a copy-paste error, truncation, or an environment variable that wasn't loaded correctly.
- The token **doesn't have the required permissions** — for WhatsApp, the token needs the `whatsapp_business_messaging` permission.

## 2. How to investigate and resolve

1. **Check token validity** — call `GET https://graph.facebook.com/debug_token?input_token={TOKEN}&access_token={APP_TOKEN}` to see if the token is still valid and what scopes it carries.
2. **Verify environment configuration** — confirm the token in the running environment (env vars, secrets manager) matches what was generated in the Meta developer console. Look for truncation or extra whitespace.
3. **Check token expiry** — if using a long-lived token, check its `expires_at` timestamp from the debug endpoint.
4. **Regenerate the token** — if expired or revoked, generate a new System User token in the Meta Business Suite with the correct permissions.
5. **Rotate and deploy** — update the token in the secrets store / environment variables and redeploy.

## 3. What to check if the API accepted the message but it was never delivered

- **Message status webhooks** — check the webhook callbacks from Meta. A `sent` status does not mean `delivered`; look for `delivered` and `read` status updates.
- **Recipient phone number** — verify the number is a valid WhatsApp number (registered on WhatsApp, includes country code, no formatting characters).
- **Template approval** — if sending a template message, confirm the template is approved and the language matches.
- **24-hour window** — outside the 24-hour customer-service window, only approved template messages can be sent. A non-template message outside this window is silently dropped.
- **Rate limits / quality rating** — check the phone number's quality rating in Meta Business Suite. A low rating leads to reduced throughput or blocked sending.
- **Recipient blocking** — the recipient may have blocked the business number.

## 4. How to detect similar failures promptly

- **Structured logging** — log every API call with its response code, error type, and error code (without logging tokens or sensitive data). Feed these logs into a monitoring system.
- **Alerting on error spikes** — set up alerts for sudden increases in `code: 190` or any 4xx/5xx responses. A single 190 error should trigger a high-priority alert since it means all messages will fail until the token is fixed.
- **Health-check endpoint** — create an internal endpoint that periodically validates the stored token against Meta's debug endpoint. Alert when validity drops below a threshold (e.g. token expires within 7 days).
- **Webhook monitoring** — monitor the ratio of `sent` to `delivered` statuses. A drop in delivery rate indicates a problem even when the API accepts messages.
- **Dead-letter queue** — failed messages should be queued for retry with exponential backoff. After max retries, alert the operations team.
