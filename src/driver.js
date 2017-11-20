import Stream from 'xstream';

const getUrl = ({ input, url }) => (input && input.url) || url;

const coerceRequest = input => {

  const request = typeof input === 'string'
    ? { url: input }
    : { ...input };

  if (!request.key)
    request.key = getUrl(request);

  return request;
};

const filterByKey = (response$$, key) => response$$.filter(response$ => response$.request.key === key);

const filterByUrl = (response$$, url) => response$$.filter(response$ => getUrl(response$.request) === url);

const FetchDriver = ({ fetch = global.fetch, ...defaultOptions } = {}) => {

  return request$ => {

    const response$$ = Stream.create({
      start: listener => {

        request$
          .map(coerceRequest)
          .addListener({
            next: request => {

              const { input, url, options } = request;
              const response$ = Stream.fromPromise(fetch(input || url, { ...defaultOptions, ...options }));

              response$.request = request;
              listener.next(response$);
            },
            error: error => listener.error(response$$, error),
            complete: out => listener.complete(response$$, out)
          });
      },
      stop: () => {}
    });

    response$$.filterByKey = filterByKey.bind(null, response$$);
    response$$.filterByUrl = filterByUrl.bind(null, response$$);

    return response$$
  }
};

export default FetchDriver;
