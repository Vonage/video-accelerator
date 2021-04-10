import chai from 'chai';
import Sinon from 'sinon';

import { log } from '../src/log';

chai.should();

describe('Log', () => {
  it('should write to the console', () => {
    const consoleLogFake = Sinon.fake;
    Sinon.replace(console, 'log', consoleLogFake);

    const stub = Sinon.stub(console, 'log');

    log('test message');

    stub.calledOnce.should.eq(true);

    Sinon.reset();
  });
});
