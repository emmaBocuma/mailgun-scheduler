import * as mailgun from "mailgun-js";
import { SCHEDULING_STAGE_KEY } from "./constants";

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
