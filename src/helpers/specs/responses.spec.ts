import * as chai from 'chai';
import * as sinon from 'sinon';
import { responseWithError, responseAsUnbehaviorError } from '../responses';

const {expect} = chai;

describe('Helpers Responses', () => {

  let stubResponse;
  let mock;
  beforeEach(() => {
    stubResponse = {
      status: () => {
        return 200;
      },
      json: () => {
        return {};
      }
    };
    mock = sinon.mock(stubResponse);
    mock.expects('status').once().returns(stubResponse);
    mock.expects('json').once().returnsArg(0);
  });

  it('will provide a status code in the result json by responseWithError', () => {
    expect(responseWithError(stubResponse as any, 404, { 'error': 'Not found' }))
      .is.deep.equals({ 'error': 'Not found', 'status': 404 });

    mock.verify();
  });

  it('will provide a status code and details in the result json by responseAsUnbehaviorError', () => {
    expect(responseAsUnbehaviorError(stubResponse as any, new Error('Message')))
      .is.deep.equals({ 'error': 'Error', 'message': 'Message', 'status' : 500 });

    mock.verify();
  });

});
