<template>
  <v-app class="container">
    <div class="item-wrapper">
      <v-card>
        <v-container style="height: 100%">
          <v-row style="height: 100%; margin: 0">
            <v-col>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="toEditor()" icon="mdi-plus">
                </v-btn>
                <v-spacer></v-spacer>
              </v-card-actions>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
      <ItemCard
        v-for="item in itemList"
        :options="item"
        :key="item.itemId"
        @to-editor="toEditor"
        @on-del="getList"
      />
    </div>
  </v-app>
</template>

<script setup lang="ts">
import ItemApi from "../../api/item";
import ItemCard from "./components/ItemCard.vue";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { SysStore } from "../../store/modules/sys";
type RouterParams = {
  path?: string;
  name?: string;
  params?: any;
  query?: any;
};
const router = useRouter();
const itemList = ref<any[]>([]);
async function getList() {
  try {
    const { data, code, msg } = await ItemApi.getAllItem();
    if (code != 0) {
      SysStore().snackOpen(msg);
      return;
    }
    itemList.value = data;
  } catch (e) {
    console.error(e);
  }
}

function toEditor() {
  router.push({ name: "editor" });
}

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.item-wrapper {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(100px, 200px));
}
</style>
