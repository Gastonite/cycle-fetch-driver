const { Stream } = require('xstream');
const { adapt } = require('@cycle/run/lib/adapt');

const getUrl = ({ input, url }) => (input && input.url) || url;

const coerceRequest = input => {

  const request = typeof input === 'string'
    ? { url: input }
    : { ...input };

  if (!request.key)
    request.key = getUrl(request);

  return request;
};

const FetchSource = response$$ => Object.assign(adapt(response$$), {
  filterByKey: key => FetchSource(response$$.filter(({ request }) => request.key === key)),
  filterByUrl: url => FetchSource(response$$.filter(({ request }) => getUrl(request) === url))
})

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


    return FetchSource(response$$)
  }
};


export default FetchDriver;
