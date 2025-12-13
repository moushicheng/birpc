export type ArgumentsType<T> = T extends (...args: infer A) => any ? A : never
export type ReturnType<T> = T extends (...args: any) => infer R ? R : never

export type Thenable<T> = T | PromiseLike<T>

export function createPromiseWithResolvers<T>(): {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
} {
  let resolve: (value: T | PromiseLike<T>) => void
  let reject: (reason?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve: resolve!, reject: reject! }
}

const _cacheMap = new WeakMap<any, any>()
export function cachedMap<T, R>(items: T[], fn: ((i: T) => R)): R[] {
  return items.map((i) => {
    let r = _cacheMap.get(i)
    if (!r) {
      r = fn(i)
      _cacheMap.set(i, r)
    }
    return r
  })
}

const random = Math.random.bind(Math)
// port from nanoid
// https://github.com/ai/nanoid
const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
export function nanoid(size = 21) {
  let id = ''
  let i = size
  while (i--)
    id += urlAlphabet[(random() * 64) | 0]
  return id
}
