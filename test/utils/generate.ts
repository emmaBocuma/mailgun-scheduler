import mailgunScheduler, {
  Scheduler,
  Signature,
  WebhookPayload,
  SCHEDULING_STAGE_KEY,
  EmailTemplate,
} from "../../";

export const getEmails = {
  to: "toemail@domain.com",
  from: "fromemail@domain.com",
};

export const buildTemplates = (total = 3): EmailTemplate[] => {
  const templates = [];
  for (let i = 0; i < total; i++) {
    templates.push({
      subject: `Test ${i}`,
      text: "Sending text email ${i}",
    });
  }
  return templates;
};

export const buildScheduler = (overrides = {}): Scheduler => {
  return mailgunScheduler({
    apiKey: "MOCK_API",
    domain: "MOCK_DOMAIN",
    templates: buildTemplates(),
    delay: 60,
    webhookUrl: "",
    ...getEmails,
    ...overrides,
  });
};

export const buildSignature = (overrides = {}): Signature => {
  return {
    timestamp: "1500948491",
    signature: "MOCK_SIGNATURE",
    token: "MOCK_TOKEN",
    ...overrides,
  };
};

export const buildWebhook = (overrides = {}): WebhookPayload => {
  return {
    signature: buildSignature(),
    "event-data": {
      ["user-variables"]: {
        [SCHEDULING_STAGE_KEY]: 0,
      },
    },
    ...overrides,
  };
};
