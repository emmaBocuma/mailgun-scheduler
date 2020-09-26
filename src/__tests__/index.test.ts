/* eslint-disable @typescript-eslint/no-explicit-any */
import mailgun from "mailgun-js";
import mailgunScheduler from "../../src";
import { SCHEDULING_STAGE_KEY } from "../common/constants";
import { Scheduler, EmailTemplate } from "../common/types";
import { getDelayedDate } from "../utils/date";
import {
  buildScheduler,
  buildWebhookPayload,
  buildTemplates,
  buildEmailParams,
} from "../../test/utils/generate";

/* Test set up */

jest.mock("mailgun-js", () => {
  const mockedFns = {
    messages: jest.fn().mockReturnThis(),
    send: jest.fn((data) => {
      return data;
    }),
    validateWebhook: jest.fn(() => true),
  };
  return jest.fn(() => mockedFns);
});

let scheduler: Scheduler;
let spy: jest.SpyInstance;
const now = new Date("2020-04-22T10:20:30Z");
const mockedMailgun = mailgun({ apiKey: "", domain: "" });

beforeAll(() => {
  spy = jest.spyOn(Date, "now");
  spy.mockImplementation(() => now.getTime());
});

afterAll(() => {
  spy.mockRestore();
});

afterEach(() => {
  jest.clearAllMocks();
});

/* Start tests */

test("scheduler throws error with invalid constructor args", async () => {
  expect(
    () => (scheduler = mailgunScheduler({} as any)),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Mailgun Scheduler: apiKey must be defined"`,
  );
});

test("scheduler throws no error with valid constructor args", async () => {
  expect(() => (scheduler = buildScheduler())).not.toThrowError();
});

test("scheduler sends expected data", async () => {
  const templates: EmailTemplate[] = [
    {
      subject: "Test 0",
      text: "Sending html email 0",
    },
    {
      subject: "Test 1",
      text: "Sending html email 1",
    },
  ];
  scheduler = buildScheduler();
  const mockData = buildEmailParams({ templates });
  await scheduler.start(mockData);
  expect(mockedMailgun.messages().send).toBeCalledTimes(1);

  const { to, from, delay } = mockData;
  const { subject, text } = mockData.templates[0];

  expect(
    (mockedMailgun.messages().send as jest.Mock).mock.calls[0][0],
  ).toMatchObject({
    to,
    from,
    subject,
    text,
    "o:deliverytime": getDelayedDate(delay),
    [SCHEDULING_STAGE_KEY]: 0,
  });
});

test("scheduler handleWebhook returns error if webhook signature is not valid", async () => {
  mockedMailgun.validateWebhook = () => false;
  scheduler = buildScheduler({ validateWebhooks: true });
  const res = await scheduler.handleWebhook({
    delay: 60,
    templates: buildTemplates(1),
    payload: buildWebhookPayload(),
  });
  expect(res).toMatchInlineSnapshot(
    `[Error: Mailgun Scheduler: Webhook not validated; invalid signature.]`,
  );
});

test("scheduler handleWebhook does not call send if no next template", async () => {
  scheduler = buildScheduler();

  const webhook = buildWebhookPayload();
  let templates = buildTemplates(1);
  await scheduler.handleWebhook({
    delay: 60,
    templates,
    payload: webhook,
  });
  expect(mockedMailgun.messages().send).not.toBeCalled();

  jest.clearAllMocks();

  templates = buildTemplates(2);
  webhook["event-data"]["user-variables"][SCHEDULING_STAGE_KEY] = 1;
  await scheduler.handleWebhook({
    delay: 60,
    templates,
    payload: webhook,
  });
  expect(mockedMailgun.messages().send).not.toBeCalled();
});

test("scheduler handleWebhook returns correct data", async () => {
  const to = "to@gmail.com";
  const from = "from@gmail.com";
  const templates = [
    { subject: "Email 1", text: "Email 1 text" },
    { subject: "Email 2", text: "Email 2 text" },
  ];
  const delay = 120;
  scheduler = buildScheduler();
  await scheduler.handleWebhook({
    templates,
    delay,
    payload: buildWebhookPayload({
      "event-data": {
        message: {
          headers: {
            to,
            from,
          },
        },
        ["user-variables"]: {
          [SCHEDULING_STAGE_KEY]: 0,
        },
      },
    }),
  });

  expect(mockedMailgun.messages().send).toBeCalledTimes(1);
  const { subject, text } = templates[1];
  expect(
    (mockedMailgun.messages().send as jest.Mock).mock.calls[0][0],
  ).toMatchObject({
    to,
    from,
    subject,
    text,
    [SCHEDULING_STAGE_KEY]: 1,
    "o:deliverytime": (now.getTime() / 1000 + delay).toString(),
  });
});
