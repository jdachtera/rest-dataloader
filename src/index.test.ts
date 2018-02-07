import { RestApi } from './index';

import fetch from 'jest-fetch-mock';

const asyncSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('createRestLoader', () => {
  it('should create a loader which caches get requests', async () => {
    const loader = new RestApi({
      fetch,
    });

    const mockResponseBody = { test: true };

    fetch.mockResponseOnce(mockResponseBody);

    const firstResponse = await loader.load('http://example.org/api/v1/test');
    expect(firstResponse.body).toEqual(mockResponseBody);

    const secondResponse = await loader.load('http://example.org/api/v1/test');

    expect(secondResponse.body).toEqual(mockResponseBody);

    // Should be fetched only once as the data loader should cache the first request
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should process the response middleware', async () => {
    const loader = new RestApi({
      fetch,
    });

    loader.onResponse.use((body, next) => next().then(body => body.test));

    loader.onResponse.use(response => response.body);

    loader.onResponse.use(async body => {
      await asyncSleep(20);
      return body.response_body;
    });

    const mockResponseBody = { response_body: { test: true } };

    fetch.mockResponseOnce(mockResponseBody);

    const firstResponse = await loader.load('http://example.org/api/v1/test');
    expect(firstResponse).toEqual(true);
  });

  it('should process the error middleware', async () => {
    const loader = new RestApi({
      fetch,
    });

    loader.onError.use(error => error.response_head.error_message);

    const mockResponseError = { response_head: { error_message: 'Error' } };

    fetch.mockReject(mockResponseError);

    const firstResponse = await loader.load('http://example.org/api/v1/test');

    expect(firstResponse).toEqual('Error');
  });
});
