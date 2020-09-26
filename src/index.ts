import mailgun from "mailgun-js";
import { getDelayedDate } from "./utils/date";
import { validateArgs } from "./utils/validate";
import { SCHEDULING_STAGE_KEY, PACKAGE_NAME } from "./common/constants";
import {
  ConstructorParams,
  Scheduler,
  EventHook,
  EmailParams,
  SendParams,
  WebhookHandlerParams,
} from "./common/types";

const mailgunScheduler = (options: ConstructorParams): Scheduler => {
  validateArgs(options);

  const { validateWebhooks, ...mailgunOptions } = options;
  const mailgunInstance = mailgun(mailgunOptions);

  const scheduler: Scheduler = {
    start: (props: EmailParams) => {
      scheduler.send({ ...props, stage: 0 });
    },

    handleWebhook: async (props: WebhookHandlerParams) => {
      const { timestamp, token, signature } = props.payload.signature;
      const { to, from } = props.payload["event-data"].message.headers;
      const { delay, templates } = props;

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

      const data: EventHook = props.payload["event-data"];
      const stage: number = data["user-variables"]?.[SCHEDULING_STAGE_KEY];
      if (stage != null && stage < props.templates.length - 1) {
        const res = await scheduler.send({
          to,
          from,
          delay,
          templates,
          stage: stage + 1,
        });
        return res;
      }
      return data;
    },

    send: async (props: SendParams) => {
      const { to, from, delay, templates, stage } = props;
      const { subject, text, html } = templates[stage];

      const res = await mailgunInstance.messages().send(
        {
          from,
          to,
          subject,
          ...(text && { text }),
          ...(html && { html }),
          ...(delay && { "o:deliverytime": getDelayedDate(delay) }),
          [SCHEDULING_STAGE_KEY]: stage,
        },
        (error: mailgun.Error, body: mailgun.messages.SendResponse) =>
          error || body,
      );
      return res;
    },
  };

  return scheduler;
};

export = mailgunScheduler;
