import * as mailgun from "mailgun-js";
import { getDelayedDate } from "./utils";

export const SCHEDULING_STAGE_KEY = "v:stage";

export interface EmailTemplate {
  subject: string;
  text?: string;
  html?: string;
}

export interface ConstructorParams {
  apiKey: string;
  domain: string;
  endpoint?: string;
  host?: string;
  templates: EmailTemplate[];
  to: string;
  from: string;
  delay: number;
  webhookUrl: string;
  initialDelay?: boolean;
  validateWebhooks?: boolean;
}

export interface Scheduler {
  send: (stage: number, scheduled?: boolean) => void;
  start: () => void;
  handleWebhook: (payload: WebhookPayload) => void;
  mailgun: () => mailgun.Mailgun;
}

export interface Signature {
  timestamp: string;
  token: string;
  signature: string;
}

export interface EventHook {
  [key: string]: unknown;
  ["user-variables"]: {
    [key: string]: unknown;
    [SCHEDULING_STAGE_KEY]: number;
  };
}

export interface WebhookPayload {
  signature: Signature;
  "event-data": EventHook;
}

const mailgunScheduler = (options: ConstructorParams): Scheduler => {
  const {
    templates,
    to,
    from,
    delay,
    initialDelay,
    validateWebhooks,
    ...mailgunOptions
  } = options;
  const mailgunInstance = mailgun(mailgunOptions);

  const scheduler: Scheduler = {
    start: () => {
      scheduler.send(0, initialDelay);
    },

    handleWebhook: async (payload: WebhookPayload) => {
      const { timestamp, token, signature } = payload.signature;
      const validationPassed = validateWebhooks
        ? await mailgunInstance.validateWebhook(
            parseInt(timestamp),
            token,
            signature,
          )
        : true;

      if (!validationPassed) {
        return new Error("Webhook not validated: invalid signature.");
      }

      const data: EventHook = payload["event-data"];
      const stage: number = data["user-variables"]?.[SCHEDULING_STAGE_KEY];
      if (stage != null && stage < templates.length - 1) {
        const res = await scheduler.send(stage + 1, true);
        return res;
      }
      return data;
    },

    send: async (stage, scheduled = false) => {
      const { subject, text, html } = templates[stage];

      const res = await mailgunInstance.messages().send(
        {
          from,
          to,
          subject,
          ...(text && { text }),
          ...(html && { html }),
          ...(scheduled && { "o:deliverytime": getDelayedDate(delay) }),
          [SCHEDULING_STAGE_KEY]: stage,
        },
        (error: mailgun.Error, body: mailgun.messages.SendResponse) =>
          error || body,
      );
      return res;
    },

    mailgun: () => mailgunInstance,
  };

  return scheduler;
};

export default mailgunScheduler;
