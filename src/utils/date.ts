export const getDelayedDate = (delay: number): string => {
  const maxDelayInSecs = 60 * 60 * 24 * 3; // Three days
  if (delay >= maxDelayInSecs) {
    throw new Error(
      "Delay is to big -  Mailgun service states messages can be scheduled a maximum of 3 days in the future.",
    );
  }
  const now = new Date(Date.now()).getTime();
  return (now / 1000 + delay).toString();
};
