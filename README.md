# Mailgun Scheduler

A Node.js library for scheduling sequential emails.  
Use this library in combination with Mailgun [webhooks](https://documentation.mailgun.com/en/latest/user_manual.html#webhooks).
Webhook handler will send as many emails as are provided in templates argument, and tracks the current status using an inbuilt custom variable.

Mailgun only allows delayed sending of [up to three days](https://documentation.mailgun.com/en/latest/user_manual.html#scheduling-delivery). This library allows you to schedule followup emails on delivery of previous email, allowing scheduled emails to exceed this time limit past the first email delivery date.

## Installation

    npm install mailgun-scheduler

## Options

Mailgun Scheduler is based on [mailgun-js](https://www.npmjs.com/package/mailgun-js) and accepts the same options for the initialising call. Required arguments are `apiKey` and `domain`.

## Example usage

```
const mgScheduler = require("mailgun-scheduler");

const scheduler = mgScheduler({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

const delay = 60 x 60 x 48; // Two days as seconds

const templates: [
  {
    subject: "Greetings",
    text: "My first email."
  },
  {
    subject: "Hello again",
    text: "A follow up email"
  },
  {
    subject: "That's all for now",
    text: "Another follow up email"
  }
]

// Sends first email immediately (unless delay property added)
scheduler.start({
  to: "to@example.com",
  from: "from@example.com",
  templates,
  customVars: {
    clientId: "44845kjrngu8"
  }
});

// Handles mailgun events - schedules followup emails
const processMailgunEvent = async (payload) => {
  try {
    const customVars = eventData["user-variables"];
    await validateId(customVars.clientId);

    const eventData = payload["event-data"];
    if (eventData.event === "delivered") {
      // Schedule next email once current email has been delivered
      return await emailService.handleWebhook({
        delay,
        payload,
        templates,
      });
    }
    return null;
  } catch (err) {
    console.log(err)
  }
}

// Mailgun allows unsubscribe links in emails which is handled automatically,
// however if you want to unsubscribe an address via the API:
const manualUnsubscribe = async (email) => {
  try {
    return await scheduler.handleUnsubscribe(email);
  } catch (err) {
    console.log(err)
  }
}


```
