export default class LocalDB {

  //Создание/Открытие базы
  static open (dbName:string, init?: (this:IDBDatabase) => void): Promise<LocalDB> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window))
        return reject(new Error('not supported'))
      const dbOpen = indexedDB.open(dbName)
      dbOpen.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        if (event.oldVersion === 0 && typeof init === 'function')
          init.call(dbOpen.result)
      }
      dbOpen.onsuccess = () => resolve(new this(dbOpen.result))
      dbOpen.onerror = (e: any) => reject(new Error(`LocalDB error: ${ e.target?.errorCode || '' }`))
    })
  }

  //Удаление базы
  static delete (dbName:string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window))
        return reject(new Error('not supported'))
      const dbOpen = indexedDB.deleteDatabase(dbName)
      dbOpen.onsuccess = () => resolve(true)
      dbOpen.onerror = (e: any) => reject(new Error(`LocalDB error: ${ e.target?.errorCode || '' }`))
    })
  }

  private db: IDBDatabase | null = null

  private constructor (db: IDBDatabase) {
    this.db = db
    this.db.onversionchange = () => {
      db.close()
      location.reload()
    }
  }

  private condition2query (condition: Condition): IDBValidKey | IDBKeyRange | undefined {
    const keys = Object.keys(condition)
    if (!keys.length) return
    let r: IDBValidKey | IDBKeyRange | undefined = undefined
    if (keys.includes('=='))
      r = condition['==']
    else if (keys.includes('>')) {
      if (keys.includes('<'))
        r = IDBKeyRange.bound(condition['>'], condition['<'])
      else if (keys.includes('<='))
        r = IDBKeyRange.bound(condition['>'], condition['<='], false, true)
      else
        r = IDBKeyRange.lowerBound(condition['>'])
    }
    else if (keys.includes('>=')) {
      if (keys.includes('<'))
        r = IDBKeyRange.bound(condition['>='], condition['<'], true)
      else if (keys.includes('<='))
        r = IDBKeyRange.bound(condition['>='], condition['<='], true, true)
      else
        r = IDBKeyRange.lowerBound(condition['>='], true)
    }
    else if (keys.includes('<'))
      r = IDBKeyRange.upperBound(condition['<'])
    else if (keys.includes('<='))
      r = IDBKeyRange.upperBound(condition['<='], true)
    return r
  }

  public store (storeName: string) {
    return new LocalDBStore(this, storeName)
  }

  public transaction<T> (storeName: string, mode: IDBTransactionMode, func: TransactionCallback<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.db === null)
        return reject(new Error('LocalDB error: db is not opened'))
      const transaction = this.db.transaction(storeName, mode),
        store = transaction.objectStore(storeName)
      func.call(store, resolve, reject)
      transaction.onerror = transaction.onabort = () => reject(transaction.error)
    })
  }

  public create<T>(storeName: string, value: T):Promise<number> {
    return this.transaction<number>(storeName, 'readwrite', function (resolve, reject) {
      const request = this.getAllKeys()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        let key = Math.max(...request.result as number[]) + 1
        if (key < 1)
          key = 1
        this.put({key, value, updated: new Date()})
        resolve(key)
      }
    })
  }

  public update<T>(storeName: string, key: IDBValidKey, value: T): Promise<boolean> {
    return this.transaction<boolean>(storeName, 'readwrite', function (resolve) {
      this.put({key, value, updated: new Date()})
      resolve(true)
    })
  }

  public remove (storeName: string, key: IDBValidKey): Promise<boolean> {
    return this.transaction<boolean>(storeName, 'readwrite', function (resolve) {
      this.delete(key)
      resolve(true)
    })
  }

  public removeAll (storeName: string, condition: Condition): Promise<boolean> {
    const r = this.condition2query(condition)
    return this.transaction<boolean>(storeName, 'readwrite', function (resolve, reject) {
      if (r === undefined)
        return reject(new Error('condition is empty'))
      this.delete(r)
      resolve(true)
    })
  }

  public clear (storeName: string):Promise<boolean> {
    return this.transaction<boolean>(storeName, 'readwrite', function (resolve) {
      this.clear()
      resolve(true)
    })
  }

  public find<T>(storeName: string, key: IDBValidKey): Promise<StoreRecord<T>> {
    return this.transaction<StoreRecord<T>>(storeName, 'readonly', function (resolve, reject) {
      const request = this.get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  public where<T>(storeName: string, condition: Condition): Promise<StoreRecord<T>[]> {
    const r = this.condition2query(condition)
    return this.transaction<StoreRecord<T>[]>(storeName, 'readonly', function (resolve, reject) {
      if (r === undefined)
        return reject(new Error('condition is empty'))
      const request = this.getAll(r)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

}

export class LocalDBStore {

  private db: LocalDB
  private storeName: string

  constructor (db: LocalDB, storeName: string) {
    this.db = db
    this.storeName = storeName
  }

  public create<T>(value: T):Promise<number> {
    return this.db.create(this.storeName, value)
  }

  public update<T>(key: IDBValidKey, value: T):Promise<boolean> {
    return this.db.update<T>(this.storeName, key, value)
  }

  public remove (key: IDBValidKey) {
    return this.db.remove(this.storeName, key)
  }

  public removeAll (condition: Condition):Promise<boolean> {
    return this.db.removeAll(this.storeName, condition)
  }

  public clear ():Promise<boolean> {
    return this.db.clear(this.storeName)
  }

  public find<T>(key: IDBValidKey): Promise<StoreRecord<T>> {
    return this.db.find(this.storeName, key)
  }

  public where<T>(condition: Condition): Promise<StoreRecord<T>[]> {
    return this.db.where<T>(this.storeName, condition)
  }

}

/*
Примеры
(async () => {
  await LocalDB.delete('newDB') //Удаление базы
  const db = await LocalDB.open('newDB', function () { this==db
    // ИНИЦИАЛИЗАЦИЯ ХРАНИЛИЩ И ИНДЕКСОВ
    for(let storeName of ['users','chats','messages'])
      this.createObjectStore(storeName, {keyPath: 'key', autoIncrement: true})
  })
  const messages = db.store('messages') //Объект хранилища
  const msgs1 = await messages.where<Message>({'>': 0, '<=' 5})  //выборка нескольких элементов
  const id = await messages.create<Message>({
    subject: 'test',
    body: message.value,
    user_id: Math.round(Math.random() + 1)
  })
  const msgs1 = await messages.find<Message>(5)  //выборка одного элемента

})()
*/