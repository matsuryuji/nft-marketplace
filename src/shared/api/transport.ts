let transportReady: Promise<unknown> = Promise.resolve()

export function setTransportReady(ready: Promise<unknown>) {
  transportReady = ready
}

export function whenTransportReady() {
  return transportReady
}
