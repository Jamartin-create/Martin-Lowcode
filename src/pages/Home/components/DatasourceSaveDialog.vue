<template>
  <v-dialog v-model="vis" width="400px" transition="dialog-bottom-transition">
    <template v-slot:activator="{ props }">
      <v-btn variant="tonal" v-bind="props">新增</v-btn>
    </template>
    <v-card>
      <v-toolbar dark>
        <v-btn icon dark @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>新增数据源</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn @click="save" :loading="btnLoading"> 保存 </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-container>
        <v-text-field
          v-model="formParams.dsTitle"
          label="数据源标题"
          variant="underlined"
          density="comfortable"
        ></v-text-field>
        <v-text-field
          v-model="formParams.dsApiPath"
          label="动态数据API路径"
          variant="underlined"
          density="comfortable"
        ></v-text-field>
        <v-select
          chips
          multiple
          label="设备列表"
          :items="deviceList"
          item-title="dev_name"
          item-value="id"
          v-model="formParams.devId"
          variant="underlined"
          density="comfortable"
        ></v-select>
        <v-select
          label="数据列表"
          :items="dataList"
          item-title="data_label"
          item-value="data_code"
          v-model="formParams.dataCode"
          variant="underlined"
          density="comfortable"
        ></v-select>
        <!-- <div>
          <span class="json-title">静态数据</span>
          <v-json-edit
            class="json-edit"
            height="150"
            :mainMenuBar="false"
            :statusBar="false"
            :navigationBar="false"
            mode="text"
            v-model="jsonData"
          />
        </div> -->
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import VJsonEdit from "vue3-ts-jsoneditor";
import { useDialogOpenClose } from "../../../hooks/useDialog";
import { ref, reactive, inject } from "vue";
import { DataSourceType } from "../../../api/datasource";
import DataSourceApi from "../../../api/datasource";
import { SysStore } from "../../../store/modules/sys";
const { vis, close, btnLoading, loading, unLoading } = useDialogOpenClose();
const emits = defineEmits(["on-save"]);

const formParams = reactive<Partial<DataSourceType>>({
  dsTitle: "",
  dsApiPath: "",
  dsStaticDatas: "",
  devId: null,
  dataCode: null,
});
const jsonData = ref<any>({});

async function save() {
  loading();
  try {
    // formParams.dsStaticDatas = JSON.parse(jsonData.value);
    const { code, msg } = await DataSourceApi.saveOne(formParams);
    if (code != 0) {
      SysStore().snackOpen(msg);
      return;
    }
    emits("on-save");
    close();
  } catch (e) {
    console.error(e);
  } finally {
    unLoading();
  }
}

const deviceList: any[] = inject("deviceList")!;
const dataList: any[] = inject("dataList")!;
</script>

<style scoped lang="scss">
.json-title {
  color: #969696;
}
:deep(.json-edit) {
  .cm-gutters {
    display: none;
  }
  .jse-contents {
    border-radius: 12px;
    border-top: 1px solid #d7d7d7;
  }
  .jse-text-mode.no-main-menu.svelte-1yqirn0.svelte-1yqirn0 {
    border-top: 0px;
  }
}
</style>
