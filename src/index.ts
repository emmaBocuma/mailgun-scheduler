import mailgun from "mailgun-js";
import { getDelayedDate } from "./utils/date";
import { validateArgs } from "./utils/validate";
import { SCHEDULING_STAGE_KEY, PACKAGE_NAME } from "./common/constants";
import {
  ConstructorParams,
  Scheduler,
  WebhookPayload,
  EventHook,
} from "./common/types";

const mailgunScheduler = (options: ConstructorParams): Scheduler => {
  validateArgs(options);

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
        return new Error(
          `${PACKAGE_NAME}: Webhook not validated; invalid signature.`,
        );
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

export = mailgunScheduler;
