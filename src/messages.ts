export const TYPE_REQUEST = 'q' as const
export const TYPE_RESPONSE = 's' as const

export interface RpcRequest {
  /**
   * Type
   */
  t: typeof TYPE_REQUEST
  /**
   * ID
   */
  i?: string
  /**
   * Method
   */
  m: string
  /**
   * Arguments
   */
  a: any[]
  /**
   * Optional
   */
  o?: boolean
}
export interface RpcResponse {
  /**
   * Type
   */
  t: typeof TYPE_RESPONSE
  /**
   * Id
   */
  i: string
  /**
   * Result
   */
  r?: any
  /**
   * Error
   */
  e?: any
}

export type RpcMessage = RpcRequest | RpcResponse
