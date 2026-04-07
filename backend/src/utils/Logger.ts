
export class Logger {
  private readonly prefix: string;

  constructor(
    private readonly nkLogger: nkruntime.Logger,
    context: string,
  ) {
    this.prefix = `[${context}]`;
  }

  info(msg: string,  ...args: unknown[]): void { this.nkLogger.info (`${this.prefix} ${msg}`, ...args); }
  warn(msg: string,  ...args: unknown[]): void { this.nkLogger.warn (`${this.prefix} ${msg}`, ...args); }
  error(msg: string, ...args: unknown[]): void { this.nkLogger.error(`${this.prefix} ${msg}`, ...args); }
  debug(msg: string, ...args: unknown[]): void { this.nkLogger.debug(`${this.prefix} ${msg}`, ...args); }

  child(subContext: string): Logger {
    return new Logger(this.nkLogger, `${this.prefix.slice(1, -1)}:${subContext}`);
  }
}
