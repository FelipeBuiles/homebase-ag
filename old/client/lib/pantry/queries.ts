export const getExpiringWindow = (now: Date, warningDays: number) => {
  const start = new Date(now);
  const end = new Date(now);
  end.setDate(end.getDate() + warningDays);
  return { start, end };
};
