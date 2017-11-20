import Stream from 'xstream';
import flattenConcurrently from 'xstream/extra/flattenConcurrently';
import buffer from 'xstream/extra/buffer';
import identity from 'ramda/src/identity';
import prop from 'ramda/src/prop';
import FetchDriver from '../src/driver';
import { parse as parseUrl } from 'url'
import Assert from 'assert';
import { withTime } from 'cyclejs-test-helpers';


describe('FetchDriver', () => {

  let _originalFetch;
  let _fetches;

  const mockFetch = (input, init) => {

    const url = input.url || input;
    const resource = parseUrl(url).pathname.replace('/', '');

    _fetches.push([input, init]);

    return Promise.resolve({
      url,
      status: 200,
      statusText: 'OK',
      ok: true,
      data: resource
    })
  };

  before(() => {

    _originalFetch = global.fetch;
    global.fetch = mockFetch;
  });

  after(done => {

    global.fetch = _originalFetch;
    done()
  });

  beforeEach(() => {
    _fetches = []
  });


  describe('should create a fetchDriver function', () => {

    it('with no arguments', done => {

      const fetchDriver = FetchDriver();

      Assert(typeof fetchDriver === 'function', 'should return a function');

      const url = 'http://api.test/resource';

      const request$ = Stream.of({ url });

      fetchDriver(request$)
        .compose(flattenConcurrently)
        .compose(buffer(Stream.never()))
        .addListener({
          next: responses => {

            Assert.equal(responses.length, 1);

            const response = responses[0];

            Assert.equal(response.url, url);
            Assert.equal(_fetches.length, 1, 'should call fetch once');
            Assert.deepEqual(_fetches[0], ['http://api.test/resource', {}],
              'should call fetch with url and no options');

            done()
          },
          error: err => {
            console.error('erf', err)
          }
        });
    });

    it('with a custom fetch function', () => {

      const request1 = 'http://api.test/resource1';
      const request2 = 'http://api.test/resource2';

      let fetchDriver;

      return withTime(Time => {

        const expected$ = Time.diagram('--0----1-2---', [
          request1,
          request2,
          request1
        ]);


        const actual$ = Stream.create({
          start: listener => {

            fetchDriver = FetchDriver({
              fetch: (url) => {
                listener.next(url)
              }
            });
            fetchDriver(expected$).addListener(identity);

          },
          stop: identity
        });


        Time.assertEqual(
          actual$,
          expected$
        );

      })();
    });
  });


  it('should accept string requests', done => {

    const fetchDriver = FetchDriver();
    const request1 = 'http://api.test/resource1';

    const request$ = Stream.of(request1);

    fetchDriver(request$)
      .compose(flattenConcurrently)
      .compose(buffer(Stream.never()))
      .addListener({
        next: responses => {

          Assert.equal(responses.length, 1);

          responses.forEach(response => {
            Assert.equal(response.data, 'resource1', 'should return resource1')
          });

          done();
        }
      });
  });

  it('should accept object requests', done => {

    const fetchDriver = FetchDriver();
    const request1 = { url: 'http://api.test/resource1' };

    const request$ = Stream.of(request1);

    fetchDriver(request$)
      .compose(flattenConcurrently)
      .compose(buffer(Stream.never()))
      .addListener({
        next: responses => {

          Assert.equal(responses.length, 1);

          responses.forEach(response => {
            Assert.equal(response.data, 'resource1', 'should return resource1')
          });

          done()
        }
      });
  });


  it('should filter responses by url', done => {

    const fetchDriver = FetchDriver();

    const url1 = 'http://api.test/resource1';
    const url2 = 'http://api.test/resource2';

    const request$ = Stream.of(
      { url: url1 },
      { url: url2 },
      url1
    );

    fetchDriver(request$)
      .filterByUrl(url1)
      .compose(flattenConcurrently)
      .compose(buffer(Stream.never()))
      .addListener({
        next: responses => {

          Assert.equal(responses.length, 2);

          Assert.deepEqual(responses.map(prop('data')), [
            'resource1',
            'resource1'
          ]);

          done();
        }
      });
  });

  it('should filter responses by key', done => {

    const fetchDriver = FetchDriver();

    const url1 = 'http://api.test/resource1';
    const url2 = 'http://api.test/resource2';

    const request$ = Stream.of(
      { input: { url: url2 }, key: 'key1' },
      { url: url1 },
      url1
    );

    fetchDriver(request$)
      .filterByKey('key1')
      .compose(flattenConcurrently)
      .compose(buffer(Stream.never()))
      .addListener({
        next: responses => {

          Assert.equal(responses.length, 1);

          Assert.deepEqual(responses.map(prop('data')), [
            'resource2'
          ]);

          done();
        }
      });
  });
});
