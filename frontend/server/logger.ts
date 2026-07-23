type LogFn = (...args: unknown[]) => void;

const logger = {
  info: ((...args) => console.log(...args)) as LogFn,
  warn: ((...args) => console.warn(...args)) as LogFn,
  error: ((...args) => console.error(...args)) as LogFn,
};

export default logger;
