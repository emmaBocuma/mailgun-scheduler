import mailgunScheduler from "../../src";
import {
  Scheduler,
  Signature,
  WebhookPayload,
  EmailTemplate,
  EmailParams,
} from "../../src/common/types";
import { SCHEDULING_STAGE_KEY } from "../../src/common/constants";

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

export const buildEmailParams = (overrides = {}): EmailParams => {
  return {
    to: "toemail@domain.com",
    from: "fromemail@domain.com",
    delay: 60,
    templates: buildTemplates(),
    ...overrides,
  };
};

export const buildScheduler = (overrides = {}): Scheduler => {
  return mailgunScheduler({
    apiKey: "MOCK_API",
    domain: "MOCK_DOMAIN",
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

export const buildWebhookPayload = (overrides = {}): WebhookPayload => {
  return {
    signature: buildSignature(),
    "event-data": {
      message: {
        headers: {
          to: "toemail@example.com",
          from: "fromemail@example.com",
        },
      },
      ["user-variables"]: {
        [SCHEDULING_STAGE_KEY]: "0",
      },
    },
    ...overrides,
  };
};
