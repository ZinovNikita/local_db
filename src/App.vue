
<template>
  <Button label="Toggle Dark Mode" @click="toggleDarkMode()" />
  <template v-for="msg in events">
    <Message :severity="msg.value.user_id === 1 ? 'success': 'info'">
      <template #icon>
        <Avatar image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png" shape="circle" />
        <b class="p-2">{{ msg.value.subject }}</b>
        <small class="p-2">{{ msg.updated.toLocaleString() }}</small>
      </template>
      <span v-html="msg.value.body"/>
    </Message>
  </template>
  <Editor v-model="message" editorStyle="height: 320px" />
  <Button label="asdasd" @click="test()" />
</template>
<script lang="ts" setup>
import { ref } from "vue"
import LocalDB from "./libs/LocalDB"
const events = ref<StoreRecord<Message>[]>([]), message = ref('')
let test = () => {}
(async () => {
  //await LocalDB.delete('newDB')
  const db = await LocalDB.open('newDB', function () {
    for(let storeName of ['users','chats','messages'])
      this.createObjectStore(storeName, {keyPath: 'key', autoIncrement: true})
  })
  const messages = db.store('messages')
  events.value = await messages.where<Message>({'>': 0})
  test = async () => {
    await messages.create<Message>({
      subject: 'test',
      body: message.value,
      user_id: Math.round(Math.random() + 1)
    })
    message.value = ''
    events.value = await messages.where<Message>({'>': 0})
  }
})()
function toggleDarkMode() {
  const element = document.querySelector('html');
  element?.classList.toggle('p-dark');
}

</script>