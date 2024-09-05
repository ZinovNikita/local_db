type Condition = {
  '=='?: any
  '>='?: any
  '>'?: any
  '<'?: any
  '<='?: any
}
type TransactionCallback<T> = (this: IDBObjectStore, resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void
type Message = {
  subject: string
  body: string
  user_id: number
}
type StoreRecord<T> = {
  key: number
  value: T
  updated: Date
}