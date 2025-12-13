import type { BirpcReturn, ChannelOptions, EventOptions } from './main'
import type { ArgumentsType, ReturnType } from './utils'
import { createBirpc } from './main'
import { cachedMap } from './utils'

export interface BirpcGroupReturnBuiltin<RemoteFunctions> {
  /**
   * Call the remote function and wait for the result.
   * An alternative to directly calling the function
   */
  $call: <K extends keyof RemoteFunctions>(method: K, ...args: ArgumentsType<RemoteFunctions[K]>) => Promise<Awaited<ReturnType<RemoteFunctions[K]>>>
  /**
   * Same as `$call`, but returns `undefined` if the function is not defined on the remote side.
   */
  $callOptional: <K extends keyof RemoteFunctions>(method: K, ...args: ArgumentsType<RemoteFunctions[K]>) => Promise<Awaited<ReturnType<RemoteFunctions[K]> | undefined>>
  /**
   * Send event without asking for response
   */
  $callEvent: <K extends keyof RemoteFunctions>(method: K, ...args: ArgumentsType<RemoteFunctions[K]>) => Promise<void>
}

export interface BirpcGroupFn<T> {
  /**
   * Call the remote function and wait for the result.
   */
  (...args: ArgumentsType<T>): Promise<Awaited<ReturnType<T>>[]>
  /**
   * Send event without asking for response
   */
  asEvent: (...args: ArgumentsType<T>) => Promise<void>
}

export type BirpcGroupReturn<RemoteFunctions> = {
  [K in keyof RemoteFunctions]: BirpcGroupFn<RemoteFunctions[K]>
} & BirpcGroupReturnBuiltin<RemoteFunctions>

export interface BirpcGroup<RemoteFunctions, LocalFunctions = Record<string, never>> {
  readonly clients: BirpcReturn<RemoteFunctions, LocalFunctions>[]
  readonly functions: LocalFunctions
  readonly broadcast: BirpcGroupReturn<RemoteFunctions>
  updateChannels: (fn?: ((channels: ChannelOptions[]) => void)) => BirpcReturn<RemoteFunctions, LocalFunctions>[]
}

export function createBirpcGroup<RemoteFunctions = Record<string, never>, LocalFunctions extends object = Record<string, never>>(
  functions: LocalFunctions,
  channels: ChannelOptions[] | (() => ChannelOptions[]),
  options: EventOptions<RemoteFunctions, LocalFunctions> = {},
): BirpcGroup<RemoteFunctions, LocalFunctions> {
  const getChannels = () => typeof channels === 'function' ? channels() : channels
  const getClients = (channels = getChannels()) => cachedMap(channels, s => createBirpc(functions, { ...options, ...s }))

  function _boardcast(
    method: string,
    args: unknown[],
    event?: boolean,
    optional?: boolean,
  ) {
    const clients = getClients()
    return Promise.all(clients.map(c => c.$callRaw({ method, args, event, optional })))
  }

  function $call(method: string, ...args: ArgumentsType<RemoteFunctions[keyof RemoteFunctions]>) {
    return _boardcast(method, args, false)
  }
  function $callOptional(method: string, ...args: ArgumentsType<RemoteFunctions[keyof RemoteFunctions]>) {
    return _boardcast(method, args, false, true)
  }
  function $callEvent(method: string, ...args: ArgumentsType<RemoteFunctions[keyof RemoteFunctions]>) {
    return _boardcast(method, args, true)
  }

  const broadcastBuiltin = {
    $call,
    $callOptional,
    $callEvent,
  }

  const broadcastProxy = new Proxy({}, {
    get(_, method) {
      if (Object.prototype.hasOwnProperty.call(broadcastBuiltin, method))
        return (broadcastBuiltin as any)[method]

      const client = getClients()
      const callbacks = client.map(c => (c as any)[method])
      const sendCall = (...args: any[]) => {
        return Promise.all(callbacks.map(i => i(...args)))
      }
      sendCall.asEvent = async (...args: any[]) => {
        await Promise.all(callbacks.map(i => i.asEvent(...args)))
      }
      return sendCall
    },
  }) as BirpcGroupReturn<RemoteFunctions>

  function updateChannels(fn?: ((channels: ChannelOptions[]) => void)) {
    const channels = getChannels()
    fn?.(channels)
    return getClients(channels)
  }

  getClients()

  return {
    get clients() {
      return getClients()
    },
    functions,
    updateChannels,
    broadcast: broadcastProxy,
  }
}
