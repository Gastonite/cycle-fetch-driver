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
import Cycle from '@cycle/run';
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
}

Cycle.run(main, {
  HTTP: FetchDriver({
    fetch,     
    credentials: 'same-origin'
    // ...otherDefaultFetchOptions 
  })
});
```

Simple and normal use case:

```js
import Stream from 'xstream';
import Cycle from '@cycle/run';
import FetchDriver from '@gastonyte/cycle-fetch-driver';
import flattenConcurrently from 'xstream/extra/flattenConcurrently';
import {div, h1, makeDOMDriver} from '@cycle/dom';

const main = ({ HTTP }) => {
  
  const HELLO_URL = 'http://localhost:8080/hello';
  const request$ = Stream.of(HELLO_URL);
  
  const vtree$ = HTTP.filterByUrl(HELLO_URL)
    .compose(flattenConcurrently)
    .map(response => response.text())
    .flatten()
    .startWith('Loading...')
    .map(text =>
      div('.container', [
        h1(text)
      ])
    );

  return {
    DOM: vtree$,
    HTTP: request$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#app'),
  HTTP: FetchDriver()
});

```

Select all the responses for a certain key:

```js
import Stream from 'xstream';
import Cycle from '@cycle/run';
import FetchDriver from '@gastonyte/cycle-fetch-driver';
import flattenConcurrently from 'xstream/extra/flattenConcurrently';
import {div, h1, makeDOMDriver} from '@cycle/dom';

const main = ({ HTTP }) => {
  
  const HELLO_URL = 'http://localhost:8080/hello';
  const request$ = Stream.of({
    key: 'hello',
    url: HELLO_URL
  });
  
  const vtree$ = HTTP.filterByKey('hello')
    .compose(flattenConcurrently)
    .map(res => res.text())
    .flatten()
    .startWith('Loading...')
    .map(text =>
      div('.container', [
        h1(text)
      ])
    );

  return {
    DOM: vtree$,
    HTTP: request$
  };
};

Cycle.run(main, {
  DOM: makeDOMDriver('#app'),
  HTTP: FetchDriver()
});
```
