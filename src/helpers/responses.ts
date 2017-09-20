import { Response } from 'express';

/**
 * Format default error response
 * @param res
 * @param status
 * @param responseJson
 */
export function responseWithError(res: Response, status: number, responseJson: Object) {
  return res.status(status).json(Object.assign({}, responseJson, { status: status }));
}

/**
 * Format response for 500 error
 * @param res
 * @param err
 */
export function responseAsUnbehaviorError(res: Response, err: Error) {
  return responseWithError(res, 500, {
    'error': err && err.name || err,
    'message': err && err.message || ''
  });
}
