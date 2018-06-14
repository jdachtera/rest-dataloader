import isPromise from 'is-promise';

export type Middleware<I, O> = (input: I, next: () => Promise<O>) => Promise<O> | O;

export class MiddlewareRequest<I = any, O = any> {
  private currentIndex = 0;
  constructor(private callbacks: Array<Middleware<I, O>>, private data) {}

  async process(): Promise<O> {
    return this.next();
  }

  private async next(...args) {
    if (args.length) {
      this.data = args[0];
    }

    if (this.currentIndex < this.callbacks.length) {
      const currentCallback = this.callbacks[this.currentIndex];
      this.currentIndex++;
      const returnValue = currentCallback(this.data, this.next.bind(this));

      if (isPromise(returnValue)) {
        this.data = await returnValue;
      } else {
        this.data = returnValue;
      }

      await this.next();
    }
    return this.data;
  }
}

export class MiddlewareProcessor<I = any, O = any> {
  private _callbacks = [];

  use(callback: Middleware<I, O>) {
    this._callbacks.push(callback);
  }

  async process(data: I): Promise<O> {
    const request = new MiddlewareRequest<I, O>(this._callbacks, data);
    return request.process();
  }
}
