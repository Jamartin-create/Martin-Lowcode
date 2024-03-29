<template>
  <v-app class="container">
    <v-card elevation="0" :loading="btnLoading">
      <v-card-title>数据源管理</v-card-title>
      <v-card-text class="table-wrapper">
        <v-card-actions>
          <DataSourceSaveDialog @on-save="getDsList" />
        </v-card-actions>
        <v-table density="comfortable" style="min-width: 1000px">
          <thead>
            <tr>
              <th>序号</th>
              <th>数据源标题</th>
              <th>数据源静态数据</th>
              <th>数据源动态API地址</th>
              <th class="text-center" width="230px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ds, idx) in dsList" :key="ds.dsId">
              <td>{{ idx + 1 }}</td>
              <td>{{ ds.dsTitle }}</td>
              <td>静态数据</td>
              <td>{{ ds.dsApiPath }}</td>
              <td>
                <DatasourceDetailDialog :ds-id="ds.dsId" />
                <DeleteConfirm @confirm="delOne(ds.dsId)" />
                <DatasourceEditDialog @on-save="getDsList" :ds-id="ds.dsId" />
              </td>
            </tr>
          </tbody>
        </v-table>
        <v-pagination
          :length="Math.ceil(total / 10)"
          v-model:model-value="pagination.page"
          @update:model-value="onPageChange"
        ></v-pagination>
      </v-card-text>
    </v-card>
  </v-app>
</template>

<script setup lang="ts">
import { reactive, ref, provide, onMounted } from "vue";
import DataSourceApi, { DataSourceType } from "../../api/datasource";
import { SysStore } from "../../store/modules/sys";
import { replaceArray } from "../../utils/common";
import DataSourceSaveDialog from "./components/DatasourceSaveDialog.vue";
import DatasourceDetailDialog from "./components/DatasourceDetailDialog.vue";
import DatasourceEditDialog from "./components/DatasourceEditDialog.vue";
import DeleteConfirm from "../../components/DialogComponents/DeleteConfirm.vue";
import MQAPIApi from "../../api/mysql_api";
import { useDialogOpenClose } from "../../hooks/useDialog";

const dsList = reactive<DataSourceType[]>([]);

const { btnLoading, loading, unLoading } = useDialogOpenClose();

const pagination = ref<{
  page: number;
  pageSize: number;
}>({
  page: 1,
  pageSize: 10,
});
const total = ref<number>(0);

function onPageChange(e: any) {
  console.log(e);
  pagination.value.page = e;
  getDsList();
}

async function getDsList() {
  loading();
  try {
    const { code, msg, data } = await DataSourceApi.getListByPage(
      pagination.value
    );
    if (code != 0) {
      SysStore().snackOpen(msg);
      return;
    }
    replaceArray(dsList, data.ds);
    total.value = data.total;
  } catch (e) {
    console.error(e);
  } finally {
    unLoading();
  }
}

async function delOne(id: string) {
  try {
    const { code, msg } = await DataSourceApi.delOne(id);
    if (code != 0) {
      SysStore().snackOpen(msg);
      return;
    }
    SysStore().snackOpen("成功");
    getDsList();
  } catch (e) {
    console.error(e);
  }
}

//获取设备以及监测字段列表
const deviceList = ref<any[]>([]);
const dataList = ref<any[]>([]);
async function getSelectList() {
  try {
    const { code: c1, data: device, msg: m1 } = await MQAPIApi.getDeviceList();
    const { code: c2, data, msg: m2 } = await MQAPIApi.getDataList();
    if (c1 != 0 || c2 != 0) {
      SysStore().snackOpen(c1 != 0 ? m1 : m2);
      return;
    }
    dataList.value = data;
    deviceList.value = device;
  } catch (e) {
    console.error(e);
  }
}
provide("deviceList", deviceList);
provide("dataList", dataList);

onMounted(() => {
  getDsList();
  getSelectList();
});
</script>

<style scoped lang="scss">
.table-wrapper {
  overflow-x: auto;
}
</style>
