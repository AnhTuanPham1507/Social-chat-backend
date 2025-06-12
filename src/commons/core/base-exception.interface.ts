import { DomainException } from "@beincom/domain";

export class BaseException extends DomainException {
    public code: string;
    public readonly args: object;
  
    constructor(code: string, args: object = {}, cause?: Error) {
      super(code, '', cause);
      this.code = code;
      this.args = args;
    }
}