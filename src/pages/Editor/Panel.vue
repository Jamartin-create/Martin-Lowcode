<template>
  <v-app>
    <draggable
      :list="componentList"
      item-key="id"
      :group="{ name: 'component' }"
      handle=".handle"
    >
      <template #item="{ element }">
        <div
          class="cmp-wrp"
          :class="{ active: element.id == active }"
          @click.stop="selectCom(element)"
        >
          <div class="tool">
            <v-icon icon="mdi-selection-drag" class="handle"></v-icon>
            <v-icon icon="mdi-square-edit-outline"></v-icon>
            <v-icon
              icon="mdi-delete-outline"
              @click="deleteConfirm(element.id)"
            ></v-icon>
          </div>
          <component
            :is="element.tag"
            v-bind="element.props"
            v-bind:dts="element.dts"
            v-bind:styles="element.styles"
            v-bind:props2="element.props"
            >{{ element.tag == "v-btn" ? element.props.text : "" }}</component
          >
        </div>
      </template>
    </draggable>
  </v-app>
  <Dialog
    ref="ConfirmDia"
    :title="'提示'"
    :content="'确认要删除该组件？'"
    @cancel="deleteCancel"
    @confirm="deleteItem"
  />
</template>

<script setup lang="ts">
import Dialog from "../../components/DialogComponents/Dialog.vue";
import draggable from "vuedraggable";
import { ref } from "vue";
import { watch } from "vue";
import { GroupType } from "../../api/group";
import { guid } from "../../../server/src/utils/strHandler";
import { ItemStore } from "../../store/modules/item";
const emits = defineEmits(["select"]);
const itemPinia = ItemStore();

let list: any[] = [];
if (itemPinia.curItemGroup) {
  list = itemPinia.curItemGroup.groupJson!.slice();
}

//画板中的组件列表
const componentList = ref<any[]>(list);

watch(
  () => componentList,
  (n) => {
    itemPinia.saveGroup(n.value);
  },
  { deep: true, immediate: false }
);

//组件选中操作
const active = ref<string>("");
function selectCom(el: any) {
  if (active.value == el.id) return;
  active.value = el.id;
  emits("select", el);
}

//删除组件
const ConfirmDia = ref<InstanceType<typeof Dialog>>();
const delItem = ref<string>("");
function deleteConfirm(id: string) {
  delItem.value = id;
  ConfirmDia.value?.open();
}
function deleteCancel() {
  delItem.value = "";
}
function deleteItem() {
  for (let i = 0; i < componentList.value.length; i++) {
    if (componentList.value[i].id == delItem.value) {
      componentList.value.splice(i, 1);
      break;
    }
  }
}

defineExpose({
  getGroupOption(): Partial<GroupType> {
    return {
      groupJson: componentList.value,
      groupTitle: guid(),
    };
  },
});
</script>

<style scoped lang="scss">
.cmp-wrp {
  padding: 5px;
  position: relative;
  &.active {
    padding-top: 30px;
    border: 1px dashed black;
    border-radius: 3px;
    .tool {
      display: block;
    }
  }
}
.tool {
  display: none;
  position: absolute;
  z-index: 100;
  top: 0;
  font-size: 15px;
  * {
    margin-right: 10px;
  }
  i:nth-child(1) {
    cursor: move;
  }
  i:nth-child(2),
  i:nth-child(3) {
    cursor: pointer;
  }
}
</style>
