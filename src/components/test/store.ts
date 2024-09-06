import LocalDB from "../../libs/LocalDB"
const db = await LocalDB.open('newDB', function () {
  for(let storeName of ['users','chats','messages'])
    this.createObjectStore(storeName, {keyPath: 'key', autoIncrement: true})
})
export interface State {
  message1: StoreRecord<Message>
}
const messages = db.store('messages')
export default {
  namespaced: true,
  async state (): Promise<State> {
    const message1 = await messages.find<Message>(1)
    return { message1 }
  },
  mutations: {
    async setMessage1(state: State, value: Message) {
      await messages.update<Message>(1, value)
      state.message1 = await messages.find<Message>(1)
    }
  },
  actions: {
    async getMessage1 ({ commit, state }) {
      const st = await state
      const { updated } = st.message1
      if ((new Date().getTime() - updated.getTime()) / 1000 / 60 > 2) {
        let r:any = await fetch('/')
        r = await r.text()
        await commit('setMessage1', {
          subject: 'test',
          body: 'asdasdasdasdasdasdasdasdasd',
          user_id: Math.round(Math.random() + 1)
        })
      }
      return st.message1
    }

  }
}