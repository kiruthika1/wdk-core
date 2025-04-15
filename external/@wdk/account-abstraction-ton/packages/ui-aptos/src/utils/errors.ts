export function isErrorOfResourceNotFound(e: any) {
  return hasErrorCode(e, 'resource_not_found');
}

export function isErrorOfTableItemNotFound(e: any) {
  return hasErrorCode(e, 'table_item_not_found');
}

export function isErrorOfAccountNotFound(e: any) {
  return hasErrorCode(e, 'account_not_found');
}

function hasErrorCode(e: any, errorCode: string) {
  if (!e) return false;
  // todo: SDK is not stable - this is a workaround
  if (e.error_code === errorCode) return true;
  if (e.errorCode === errorCode) return true;
  const body = e.body as any;
  if (!body) return false;
  if (body.error_code === errorCode) return true;
  if (body.errorCode === errorCode) return true;
  return false;
}
