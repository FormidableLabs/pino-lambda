import pino from 'pino';

export const formatLevel = (level: string | number): string => {
  if (typeof level === 'string') {
    return level.toLocaleUpperCase();
  } else if (typeof level === 'number') {
    return pino.levels.labels[level]?.toLocaleUpperCase();
  }
  return level;
};
