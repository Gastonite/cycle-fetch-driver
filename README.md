# Cycle Fetch Driver

A [Cycle.js](http://cycle.js.org) [Driver](http://cycle.js.org/drivers.html) for making HTTP requests, using the [Fetch API](https://fetch.spec.whatwg.org/).

## Install

```sh
npm install @gastonyte/cycle-fetch-driver
```

## API

### ```FetchDriver({ fetch, ...fetchDefaultOptions }) -> fetchDriver: function```

Factory that returns a fetch driver. 

It can take an optional ```fetch``` option which allow inversion of control. (defaults to global.fetch)

All other options provided are considered fetch default options.

## Usage

Basics:

```js
import Stream from 'xstream';
import fetch from 'isomorphic-fetch';
import { run } from '@cycle/run';
import FetchDriver from '@gastonyte/cycle-fetch-driver';



const main = ({ HTTP }) => {

  HTTP.filterByKey('anotherKey').debug('response').addListener(response$ => response$);

  return {
    HTTP: Stream.of(
      'http://localhost:3000/api',
      { key: 'oneKey', url: 'http://localhost:3000/api', options: { /* ...overrideFetchOptions */ } },
      { key: 'anotherKey', input: { url: 'http://localhost:3000/api' } }
    )
  };
};

run(main, {
  HTTP: FetchDriver({
    fetch,
    credentials: 'same-origin'
    // ...otherDefaultFetchOptions
  })
});
```

Select all the responses by key or by url:

```js
import Stream from 'xstream';
import { run } from '@cycle/run';
import FetchDriver from '@gastonyte/cycle-fetch-driver';
import fetch from 'isomorphic-fetch';

const main = ({ HTTP }) => {

  const HELLO_URL = 'https://jsonplaceholder.typicode.com/posts/1';
  const request$ = Stream.of({
    key: 'hello',
    url: HELLO_URL
  });

  HTTP.filterByKey('hello') // OR .filterByUrl(HELLO_URL)
    .flatten()
    .map(response => Stream.fromPromise(response.json()))
    .flatten()
    .map(json => ({ isLoaded: true, json }))
    .startWith({ isLoaded: false })
    .addListener({
      next: ({ isLoaded, json }) => {
        console.log('isLoaded:', isLoaded);

        if (isLoaded) {
          console.log('json:', json);
        }
      }
    });

  return {
    HTTP: request$
  };
};

run(main, {
  HTTP: FetchDriver({
    fetch
  })
});
```
