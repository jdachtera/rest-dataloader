declare module 'jest-fetch-mock';

import { RestApi } from './index';
import fetch from 'jest-fetch-mock';
import merge from 'lodash/merge';

global['fetch'] = fetch;

const asyncSleep = ms => new Promise(resolve => setTimeout(resolve, ms));
beforeEach(() => {
  global['fetch'] = fetch;
  fetch.resetMocks();
});

describe('createRestLoader', () => {
  it('should create a loader which caches get requests', async () => {
    const loader = new RestApi();

    const mockResponseBody = { test: true };

    fetch.mockResponseOnce(mockResponseBody);

    const firstResponse = await loader.load('http://example.org/api/v1/test');
    expect(firstResponse.body).toEqual(mockResponseBody);

    const secondResponse = await loader.load('http://example.org/api/v1/test');

    expect(secondResponse.body).toEqual(mockResponseBody);

    // Should be fetched only once as the data loader should cache the first request
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should process the request middleware', async () => {
    const loader = new RestApi();

    loader.use({
      onRequest: request =>
        merge(request, {
          config: {
            headers: { authorization: 'Bearer blubb' },
          },
        }),
    });

    const mockResponseBody = { test: true };

    fetch.mockResponseOnce(mockResponseBody);

    await loader.load('http://example.org/api/v1/test');

    expect(fetch).toHaveBeenCalledWith('http://example.org/api/v1/test', {
      headers: { authorization: 'Bearer blubb' },
      method: 'GET',
    });
  });

  it('should process the response middleware', async () => {
    const loader = new RestApi();

    loader.use({ onResponse: (body, next) => next().then(body => body.test) });

    loader.use({ onResponse: response => response.body });

    loader.use({
      onResponse: async body => {
        await asyncSleep(20);
        return body.response_body;
      },
    });

    const mockResponseBody = { response_body: { test: true } };

    fetch.mockResponseOnce(mockResponseBody);

    const firstResponse = await loader.load('http://example.org/api/v1/test');
    expect(firstResponse).toEqual(true);
  });

  it('should process the error middleware', async () => {
    const loader = new RestApi();

    loader.use({ onError: error => error.response_head.error_message });

    const mockResponseError = { response_head: { error_message: 'Error' } };

    fetch.mockReject(mockResponseError);

    const firstResponse = await loader.load('http://example.org/api/v1/error');

    expect(firstResponse).toEqual('Error');
  });
});
