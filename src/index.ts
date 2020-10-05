import mailgun from "mailgun-js";
import axios from "axios";
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
  const buildURL = () => {
    const protocol = options.protocol || "https:";
    const host = options.host || "api.mailgun.net";
    const endpoint = options.endpoint || "/v3";
    return `${protocol}//${host}${endpoint}/${options.domain}`;
  };

  const scheduler: Scheduler = {
    start: (props: EmailParams) => {
      return scheduler.send({ ...props, stage: 0 });
    },

    handleWebhook: async (props: WebhookHandlerParams) => {
      if (!props?.payload?.signature || !props?.payload?.["event-data"]) {
        throw new Error(
          `${PACKAGE_NAME}: Webhook does not have expected structure.`,
        );
      }
      if (!props?.delay || !props?.templates) {
        throw new Error(
          `${PACKAGE_NAME}: Webhook requires 'delay' and 'templates' params.`,
        );
      }

      const { timestamp, token, signature } = props.payload.signature;
      const validationPassed = validateWebhooks
        ? await mailgunInstance.validateWebhook(
            parseInt(timestamp),
            token,
            signature,
          )
        : true;

      if (!validationPassed) {
        throw new Error(
          `${PACKAGE_NAME}: Webhook not validated; invalid signature.`,
        );
      }

      const { to, from } = props.payload["event-data"].message.headers;
      const { delay, templates } = props;
      const data: EventHook = props.payload["event-data"];
      const stage: number = parseInt(
        data["user-variables"]?.[SCHEDULING_STAGE_KEY],
      );

      if (stage != null && stage < templates.length - 1) {
        const customVars = Object.entries(data["user-variables"]).filter(
          ([key]) => key !== SCHEDULING_STAGE_KEY,
        );
        const returnCustomVars: { [key: string]: unknown }[] = [];
        customVars.forEach(([key, value]) => {
          returnCustomVars.push({ [key]: value });
        });
        const res = await scheduler.send({
          to,
          from,
          delay,
          templates,
          stage: stage + 1,
          customVars: returnCustomVars,
        });
        return res;
      }
      return null;
    },

    send: async (props: SendParams) => {
      const { to, from, delay, templates, stage, customVars } = props;
      const { subject, text, html } = templates[stage];

      const vtaggedCustomVars: { [key: string]: unknown } = {};
      customVars?.forEach((obj) => {
        const [key, value] = Object.entries(obj)[0];
        vtaggedCustomVars[`v:${key}`] = value;
      });

      const sendData = {
        from,
        to,
        subject,
        ...(text && { text }),
        ...(html && { html }),
        ...(delay && { "o:deliverytime": getDelayedDate(delay) }),
        ...vtaggedCustomVars,
        [`v:${SCHEDULING_STAGE_KEY}`]: stage,
      };

      try {
        await mailgunInstance.messages().send(sendData);
        return sendData;
      } catch (err) {
        throw new Error(
          `${PACKAGE_NAME}: Mailgun errored while trying to send: ${err.message}`,
        );
      }
    },

    handleUnsubscribe: async (email: string) => {
      try {
        const res = await axios.post(`${buildURL()}/unsubscribes`, null, {
          auth: {
            username: "api",
            password: options.apiKey,
          },
          params: {
            address: email,
          },
        });

        return res.status === 200;
      } catch (err) {
        throw new Error(`${PACKAGE_NAME}: Unsubscribe failure: ${err.message}`);
      }
    },
  };

  return scheduler;
};

export = mailgunScheduler;
