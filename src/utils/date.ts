export const getDelayedDate = (delay: number): string => {
  const now = new Date(Date.now()).getTime();
  return (now / 1000 + delay).toString();
};
