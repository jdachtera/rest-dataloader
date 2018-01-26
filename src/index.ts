import DataLoader from "dataloader";
import merge from "lodash/merge";

type LoaderRequest = {
  url: RequestInfo;
  config: RequestInit;
};

class AsyncMiddleware {
  private callbacks = [];
  use(callback) {
    this.callbacks.push(callback);
  }

  process = async (data: any) => {
    let index = 0;

    const next = async processedData => {
      if (index < this.callbacks.length) {
        const currentCallback = this.callbacks[index];
        index++;
        return currentCallback(processedData, next);
      }

      return processedData;
    };

    return next(data);
  };
}

const createRestLoader = (defaultConfig: RequestInit) => {
  const onRequest = new AsyncMiddleware();
  const onResponse = new AsyncMiddleware();
  const onError = new AsyncMiddleware();

  const fetchWithDefaultConfig = async request => {
    try {
      const { url, config } = await onRequest.process(request);
      const response = fetch(url, merge(config, defaultConfig));
      const processedResponse = await onResponse.process(response);
      return processedResponse;
    } catch (error) {
      const processedError = await onError.process(error);
      throw processedError;
    }
  };

  const createMethodFetcher = method => (
    url: RequestInfo,
    config: RequestInit
  ) => fetchWithDefaultConfig({ url, config: merge(config, { method }) });

  const get = createMethodFetcher("GET");
  const post = createMethodFetcher("POST");
  const put = createMethodFetcher("PUT");
  const _delete = createMethodFetcher("DELETE");

  const loader = new DataLoader((requests: Array<LoaderRequest>) =>
    requests.map(({ url, config }) => get(url, config))
  );

  return {
    get,
    post,
    put,
    delete: _delete,
    loader
  };
};

export { createRestLoader };
