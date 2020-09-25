import { getDelayedDate } from "../date";

describe("Utils tests", () => {
  let spy: jest.SpyInstance;
  const now = new Date("2020-04-22T10:20:30Z");

  beforeAll(() => {
    spy = jest.spyOn(Date, "now");
    spy.mockImplementation(() => now.getTime());
  });

  afterAll(() => {
    spy.mockRestore();
  });

  test("getDelayedDate returns correct date", () => {
    const delayAmt = 60 * 60;
    const date = getDelayedDate(delayAmt);

    expect(date).toBe((now.getTime() / 1000 + delayAmt).toString());
  });
});
