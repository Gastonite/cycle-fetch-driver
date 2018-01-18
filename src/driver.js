import Stream from 'xstream';
import { assert } from 'assert';

const getUrl = ({ input, url }) => (input && input.url) || url;

const normalizeRequest = input => {
  const request = typeof input === 'string'
    ? { url: input }
    : { ...input }
  if (!request.key) {
    request.key = getUrl(request)
  }
  return request
};

const byKey = (response$$, key) => {
  return response$$
    .filter(response$ => response$.request.key === key)
};

const byUrl  = (response$$, url) => {
  return response$$
    .filter(response$ => getUrl(response$.request) === url)
};

const FetchDriver = ({ fetch = global.fetch, headers, ...defaultOptions } = {}) => {

  return request$ =>  {

    const response$$ = Stream.createWithMemory();

    request$
      .map(normalizeRequest)
      .addListener({
        next: request => {

          const { input, url } = request;
          let { options = {} } = request;

          const response$ = Stream.fromPromise(
            fetch(input || url, {
              ...defaultOptions,
              ...options,
              headers: {
                ...headers,
                ...(options.headers || {})
              }
            })
          );

          response$.request = request;
          response$$.shamefullySendNext(response$);
        },
        error: response$$.shamefullySendError.bind(response$$),
        complete: response$$.shamefullySendComplete.bind(response$$)
      });

    response$$.byKey = byKey.bind(null, response$$);
    response$$.byUrl = byUrl.bind(null, response$$);

    return response$$
  }
}

export default FetchDriver;
