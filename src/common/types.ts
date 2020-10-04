import mailgun from "mailgun-js";
import { SCHEDULING_STAGE_KEY } from "./constants";

export interface EmailTemplate {
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailParams {
  to: string;
  from: string;
  templates: EmailTemplate[];
  delay: number;
  customVars?: { [key: string]: unknown }[];
}

export interface SendParams extends EmailParams {
  stage: number;
}

export interface EventHook {
  [key: string]:
    | string
    | number
    | []
    | {
        [key: string]: unknown;
      };
  message: {
    headers: {
      to: string;
      from: string;
    };
  };
  ["user-variables"]: {
    [key: string]: unknown;
    [SCHEDULING_STAGE_KEY]: string;
  };
}

export interface Signature {
  timestamp: string;
  token: string;
  signature: string;
}

export interface WebhookPayload {
  signature: Signature;
  "event-data": EventHook;
}

export interface WebhookHandlerParams {
  delay: number;
  templates: EmailTemplate[];
  payload: WebhookPayload;
}

export interface ConstructorParams {
  [key: string]: unknown;
  apiKey: string;
  domain: string;
  validateWebhooks?: boolean;
  endpoint?: string;
  host?: string;
}

export interface Scheduler {
  send: (props: SendParams) => Promise<mailgun.messages.SendData>;
  start: (props: EmailParams) => Promise<mailgun.messages.SendData>;
  handleWebhook: (
    props: WebhookHandlerParams,
  ) => Promise<mailgun.messages.SendData | null>;
  handleUnsubscribe: (email: string) => Promise<boolean>;
}
