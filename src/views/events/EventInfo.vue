<script setup>
import { useRoute } from 'vue-router'
import { ref, onMounted, computed } from 'vue';
import { getEventById } from '@/api/event'

import EventInfoFree from '@/components/events/EventInfoFree.vue'
import EventInfoPay from '@/components/events/EventInfoPay.vue'

const route = useRoute()
const eventId = route.params.id
const isLoading = ref(true)
const errorMsg = ref('')
const event = ref(null)
const notFound = ref(false)
const eventTags = ref([])


onMounted( async() => {
  try{
    const data = await getEventById(eventId)
    console.log(`data:${data}`)
    event.value = data.event
    console.log(`data:${event.value}`)
    eventTags.value = data.tags

  }catch(err){
    if( err.response && err.response.status == 404){
      notFound.value = true
    }else{
      errorMsg.value = '取得活動資料失敗'
      console.error('取得活動資料失敗', err)
    }
  }finally{
    isLoading.value = false
    }
})

const isFree = computed(() => {
  return event.value?.price == "" || event.value?.price == null || event.value?.price == undefined
})

</script>

<template>
  <div>
    <p v-if="isLoading">載入中，請稍後...</p>
    <p v-else-if="notFound">找不到活動</p>
    <p v-else-if="errorMsg">{{ errorMsg }}</p>

    <EventInfoFree v-else-if="isFree" 
      :event="event" 
      :tags="eventTags"
      :user="event.hostUser"
    />
    <EventInfoPay v-else 
      :event="event" 
      :tags="eventTags"
      :user="event.hostUser"
    />

  </div>
</template>


<style scoped>
.page {
  padding: 2rem;
  text-align: center;
  background-color: var(--color-black);
  color: white;
}
</style>