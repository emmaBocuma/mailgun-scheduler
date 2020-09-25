import * as mailgun from "mailgun-js";
import { SCHEDULING_STAGE_KEY } from "../common/constants";
import { Scheduler, EmailTemplate } from "../common/types";
import {
  buildScheduler,
  getEmails,
  buildWebhook,
  buildTemplates,
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

test("scheduler sends expected data", async () => {
  let templates: EmailTemplate[] = [
    {
      subject: "Test 0",
      text: "Sending html email 0",
    },
  ];
  scheduler = buildScheduler({ templates });
  await scheduler.start();
  expect(mockedMailgun.messages().send).toBeCalledTimes(1);

  expect(
    (mockedMailgun.messages().send as jest.Mock).mock.calls[0][0],
  ).toMatchObject({
    ...getEmails,
    ...templates[0],
    [SCHEDULING_STAGE_KEY]: 0,
  });

  jest.clearAllMocks();

  templates = [
    {
      subject: "Test 0",
      html: "Sending text email 0",
    },
  ];
  scheduler = buildScheduler({ templates });
  await scheduler.start();
  expect(mockedMailgun.messages().send).toBeCalledTimes(1);
  expect(
    (mockedMailgun.messages().send as jest.Mock).mock.calls[0][0],
  ).toMatchObject({
    ...getEmails,
    ...templates[0],
    [SCHEDULING_STAGE_KEY]: 0,
  });
});

test("scheduler handleWebhook returns error if webhook signature is not valid", async () => {
  mockedMailgun.validateWebhook = () => false;
  scheduler = buildScheduler({ validateWebhooks: true });
  const res = await scheduler.handleWebhook(buildWebhook());
  expect(res).toMatchInlineSnapshot(
    `[Error: Webhook not validated: invalid signature.]`,
  );
});

test("scheduler handleWebhook does not call send if no next template", async () => {
  let templates = buildTemplates(1);
  scheduler = buildScheduler({
    templates,
  });
  await scheduler.handleWebhook(
    buildWebhook({
      "event-data": {
        ["user-variables"]: {
          [SCHEDULING_STAGE_KEY]: 0,
        },
      },
    }),
  );
  expect(mockedMailgun.messages().send).not.toBeCalled();

  templates = buildTemplates(2);
  scheduler = buildScheduler({
    templates,
  });
  await scheduler.handleWebhook(
    buildWebhook({
      "event-data": {
        ["user-variables"]: {
          [SCHEDULING_STAGE_KEY]: 1,
        },
      },
    }),
  );
  expect(mockedMailgun.messages().send).not.toBeCalled();
});

test("scheduler handleWebhook returns correct data", async () => {
  const to = "to@gmail.com";
  const from = "from@gmail.com";
  const templates = [
    { subject: "Email 1", text: "Email 1 text" },
    { subject: "Email 2", text: "Email 2 text" },
  ];
  const delay = 60;
  scheduler = buildScheduler({
    templates,
    to,
    from,
    delay,
  });
  await scheduler.handleWebhook(
    buildWebhook({
      "event-data": {
        ["user-variables"]: {
          [SCHEDULING_STAGE_KEY]: 0,
        },
      },
    }),
  );

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
