import { PACKAGE_NAME } from "../common/constants";

export const getDelayedDate = (delay: string | number): string => {
  const checkedDelay = Number(delay);
  const maxDelayInSecs = 60 * 60 * 24 * 3;
  if (checkedDelay > maxDelayInSecs) {
    throw new Error(
      `${PACKAGE_NAME}: Delay is too big -  Mailgun service states messages can be scheduled a maximum of 3 days in the future.`,
    );
  }
  const now = new Date(Date.now()).getTime();
  return (Math.round(now / 1000) + checkedDelay).toString();
};
