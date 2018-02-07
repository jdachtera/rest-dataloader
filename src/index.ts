import DataLoader from 'dataloader';
import merge from 'lodash/merge';

import { MiddlewareProcessor } from './MiddlewareProcessor';

type RequestConfig = RequestInit & {
  fetch: GlobalFetch;
};

type ApiRequest = {
  url: RequestInfo;
  config: RequestConfig;
};

export class RestApi {
  public onRequest = new MiddlewareProcessor<ApiRequest, ApiRequest>();
  public onResponse = new MiddlewareProcessor<Response | any, any>();
  public onError = new MiddlewareProcessor<Response | any, any>();

  private defaultConfig: RequestConfig;
  private loader = new DataLoader((requests: Array<ApiRequest>) =>
    Promise.all(requests.map(({ url, config }) => this.get(url, config))),
  );

  constructor(defaultConfig: RequestConfig) {
    this.defaultConfig = defaultConfig;
  }

  private async fetchWithDefaultConfig(request) {
    try {
      const { url, config } = await this.onRequest.process(request);
      const requestConfig = merge(config, this.defaultConfig);
      const fetch = requestConfig.fetch || require('node-fetch');
      const response = await fetch(url, requestConfig);
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

  get(url: RequestInfo, config: RequestInit = {}) {
    return this.fetchWithDefaultConfig({ url, config: merge(config, { method: 'GET' }) });
  }

  post(url: RequestInfo, config: RequestInit = {}) {
    return this.fetchWithDefaultConfig({ url, config: merge(config, { method: 'POST' }) });
  }

  put(url: RequestInfo, config: RequestInit = {}) {
    return this.fetchWithDefaultConfig({ url, config: merge(config, { method: 'PUT' }) });
  }

  delete(url: RequestInfo, config: RequestInit = {}) {
    return this.fetchWithDefaultConfig({ url, config: merge(config, { method: 'DELETE' }) });
  }

  load(...args) {
    return this.loader.load(...args);
  }
}
