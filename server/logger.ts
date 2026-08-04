export type LogFields = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface AppLogger {
  info(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

type LogSink = (line: string, level: "info" | "error") => void;

const consoleSink: LogSink = (line, level) => {
  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
};

export function createJsonLogger(sink: LogSink = consoleSink): AppLogger {
  const write = (
    level: "info" | "error",
    event: string,
    fields: LogFields = {}
  ) => {
    sink(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event,
        ...fields,
      }),
      level
    );
  };

  return {
    info: (event, fields) => write("info", event, fields),
    error: (event, fields) => write("error", event, fields),
  };
}

export const silentLogger: AppLogger = {
  info: () => undefined,
  error: () => undefined,
};
