import isPromise from 'is-promise';

type Middleware<I, O> = (input: I, next: () => Promise<O>) => Promise<O> | O;

export class MiddlewareProcessor<I = any, O = any> {
  private _callbacks = [];
  private _currentIndex = 0;
  private _processedData = null;

  use(callback: Middleware<I, O>) {
    this._callbacks.push(callback);
  }

  async process(data: I): Promise<O> {
    this._currentIndex = 0;
    this._processedData = data;

    return this._next();
  }

  private _next = async (...args) => {
    if (args.length) {
      this._processedData = args[0];
    }

    if (this._currentIndex < this._callbacks.length) {
      const currentCallback = this._callbacks[this._currentIndex];
      this._currentIndex++;
      const returnValue = currentCallback(this._processedData, this._next);

      if (isPromise(returnValue)) {
        this._processedData = await returnValue;
      } else {
        this._processedData = returnValue;
      }

      await this._next();
    }
    return this._processedData;
  };
}
