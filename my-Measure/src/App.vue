<!-- <script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <HelloWorld />
</template> -->
<template>
  <div style="padding: 20px;">
    <van-form @submit="onSubmit">
      <van-field
        v-model="form.name"
        label="物品名称"
        placeholder="请输入名称"
        :rules="[{ required: true, message: '请填写名称' }]"
      />
      <div style="display: flex; gap: 10px;">
        <van-field v-model="form.length" label="长" type="number" />
        <van-field v-model="form.width" label="宽" type="number" />
        <van-field v-model="form.height" label="高" type="number" />
      </div>
      <div style="margin: 16px 0;">
        <van-button type="primary" native-type="submit">添加</van-button>
      </div>
    </van-form>

    <van-cell
      v-for="item in items"
      :key="item.id"
      :title="item.name"
      :label="`${item.length} × ${item.width} × ${item.height} cm`"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useDimensions } from '@/composables/useDimensions';
import { showToast } from 'vant';

const { items, addItem } = useDimensions();

const form = reactive({
  name: '',
  length: 0,
  width: 0,
  height: 0,
  unit: 'cm',
  category: '未分类'
});

const onSubmit = async () => {
  if (!form.name) return showToast('请输入名称');
  await addItem(form);
  Object.assign(form, { name: '', length: 0, width: 0, height: 0 });
  showToast('添加成功');
};
</script>