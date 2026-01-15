export const formatInstructionSteps = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const matches = trimmed.match(/[^.!?]+[.!?]+/g);
  if (!matches) return [trimmed];
  return matches.map((entry) => entry.trim());
};
