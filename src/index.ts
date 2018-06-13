import DataLoader from 'dataloader';
import merge from 'lodash/merge';
import 'universal-fetch';

import { MiddlewareProcessor, Middleware } from './MiddlewareProcessor';

export type RequestConfig = RequestInit & {
  fetch?: GlobalFetch | Function;
};

export type ApiRequest = {
  url: RequestInfo;
  config: RequestConfig;
};

export class RestApi {
  private onRequest = new MiddlewareProcessor<ApiRequest, ApiRequest>();
  private onResponse = new MiddlewareProcessor<Response | any, any>();
  private onError = new MiddlewareProcessor<Response | any, any>();

  private defaultConfig: RequestConfig;
  private loader = new DataLoader(
    (requests: Array<ApiRequest>) =>
      Promise.all(requests.map(({ url, config }) => this.get(url, config))),
    {
      cacheKeyFn: (request: ApiRequest) => JSON.stringify(request),
    },
  );

  constructor(defaultConfig: RequestConfig = {}) {
    this.defaultConfig = defaultConfig;
  }

  private async fetchWithDefaultConfig(request) {
    try {
      const requestConfig = merge(request.config, this.defaultConfig);
      const processedRequest = await this.onRequest.process({
        url: request.url,
        config: requestConfig,
      });

      const fetch = processedRequest.config.fetch || global['fetch'];

      const response = await fetch(processedRequest.url, processedRequest.config);
      const processedResponse = await this.onResponse.process(response);
      return processedResponse;
    } catch (error) {
      const processedError = await this.onError.process(error);

      if (processedError === error) {
        throw error;
      } else {
        return processedError;
      }
    }
  }

  public get(url: RequestInfo, config: RequestInit = {}): Promise<any> {
    return this.fetchWithDefaultConfig({ url, config: merge(config, { method: 'GET' }) });
  }

  public post(url: RequestInfo, config: RequestInit = {}): Promise<any> {
    return this.fetchWithDefaultConfig({ url, config: merge(config, { method: 'POST' }) });
  }

  public put(url: RequestInfo, config: RequestInit = {}): Promise<any> {
    return this.fetchWithDefaultConfig({ url, config: merge(config, { method: 'PUT' }) });
  }

  public delete(url: RequestInfo, config: RequestInit = {}): Promise<any> {
    return this.fetchWithDefaultConfig({ url, config: merge(config, { method: 'DELETE' }) });
  }

  public load(url: RequestInfo, config: RequestInit = {}): Promise<any> {
    return this.loader.load({ url, config });
  }

  public use({
    onRequest,
    onResponse,
    onError,
  }: {
    onRequest?: Middleware<ApiRequest, ApiRequest>;
    onResponse?: Middleware<Response | any, any>;
    onError?: Middleware<Response | any, any>;
  }) {
    if (onRequest) {
      this.onRequest.use(onRequest);
    }
    if (onResponse) {
      this.onResponse.use(onResponse);
    }
    if (onError) {
      this.onError.use(onError);
    }
    return this;
  }
}
