interface WaitForPromise extends Promise<void> {
  cancel(): void;
}

const noop = () => {};

export function waitFor(
  condition: () => boolean | undefined | null | Promise<boolean>,
  {timeout = 1000, interval = 100} = {},
): WaitForPromise {
  let cancel: WaitForPromise['cancel'] = noop;
  const promise: WaitForPromise = new Promise<void>(async (resolve, reject) => {
    try {
      if (await condition()) {
        resolve();
        return;
      }
    } catch {
      //pass
    }

    //
    const id = setInterval(() => {
      if (condition()) {
        cancel();
        resolve();
      }
    }, interval);

    cancel = () => clearInterval(id);

    setTimeout(() => {
      cancel();
      reject(new Error(`Timed out after ${timeout}ms`, {cause: condition}));
    }, timeout);
  }) as WaitForPromise;

  promise.cancel = cancel;

  return promise;
}
