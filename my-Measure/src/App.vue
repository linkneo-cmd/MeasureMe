<template>
  <div class="container">
    <div class="search-section">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索名称、长、宽、高"
        background="#f5f6f7"
        shape="round"
        clearable
      />
    </div>

    <div class="list-section">
      <div v-if="showAddForm" class="add-form-section">
        <van-form @submit="onSubmit" class="inline-add-form">
          <van-field
            v-model="form.name"
            label="物品名称"
            placeholder="请输入名称"
            :rules="[{ required: true, message: '请填写名称' }]"
          />
          <div class="form-row">
            <van-field v-model="form.length" label="长" type="digit" placeholder="0" />
            <van-field v-model="form.width" label="宽" type="digit" placeholder="0" />
            <van-field v-model="form.height" label="高" type="digit" placeholder="0" />
          </div>
          <div class="form-actions">
            <van-button type="default" size="small" @click="cancelAdd">取消</van-button>
            <van-button type="primary" size="small" native-type="submit">确认添加</van-button>
          </div>
        </van-form>
      </div>

      <van-swipe-cell
        v-for="item in filteredItems"
        :key="item.id"
        right-width="120"
        left-width="0"
      >
        <van-cell
          :title="item.name"
          :label="`${item.length} × ${item.width} × ${item.height} cm`"
          class="list-item"
        />
        <template #right>
          <div class="swipe-actions">
            <van-button type="primary" size="small" class="edit-btn" @click="openEdit(item)">编辑</van-button>
            <van-button type="danger" size="small" class="delete-btn" @click="confirmDelete(item)">删除</van-button>
          </div>
        </template>
      </van-swipe-cell>
      <div v-if="filteredItems.length === 0 && !showAddForm" class="empty-state">
        <van-empty description="暂无数据" />
      </div>
    </div>

    <div class="bottom-action">
      <van-button type="primary" size="large" @click="showAddForm = true">
        记一下
      </van-button>
    </div>

    <van-popup
      v-model:show="showEditPopup"
      position="bottom"
      :style="{ height: '60%' }"
      round
    >
      <div class="edit-popup">
        <div class="popup-header">
          <h3>编辑记录</h3>
          <van-icon name="cross" @click="showEditPopup = false" />
        </div>
        <van-form @submit="onEditSubmit" class="edit-form">
          <van-field
            v-model="editForm.name"
            label="物品名称"
            placeholder="请输入名称"
            :rules="[{ required: true, message: '请填写名称' }]"
          />
          <div class="form-row">
            <van-field v-model="editForm.length" label="长" type="digit" placeholder="0" />
            <van-field v-model="editForm.width" label="宽" type="digit" placeholder="0" />
            <van-field v-model="editForm.height" label="高" type="digit" placeholder="0" />
          </div>
          <van-button type="primary" native-type="submit" block>保存修改</van-button>
        </van-form>
      </div>
    </van-popup>

    <van-dialog
      v-model:show="showDeleteConfirm"
      title="确认删除"
      message="确定要删除这条记录吗？"
      confirm-button-text="删除"
      cancel-button-text="取消"
      confirm-button-color="#ff6b6b"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useDimensions } from '@/composables/useDimensions';
import { showToast } from 'vant';
import type { DimensionItem } from '@/db/dexie';

const { items, addItem, deleteItem, updateItem } = useDimensions();

const searchKeyword = ref('');
const showAddForm = ref(false);

const form = reactive({
  name: '',
  length: '',
  width: '',
  height: '',
  unit: 'cm',
  category: '未分类'
});

const showEditPopup = ref(false);
const editingItem = ref<DimensionItem | null>(null);
const editForm = reactive({
  name: '',
  length: '',
  width: '',
  height: '',
  unit: 'cm',
  category: '未分类'
});

const showDeleteConfirm = ref(false);
const deletingItem = ref<DimensionItem | null>(null);

const filteredItems = computed(() => {
  if (!searchKeyword.value) return items.value;
  const keyword = searchKeyword.value.toLowerCase();
  return items.value.filter(item => {
    return (
      item.name.toLowerCase().includes(keyword) ||
      String(item.length).includes(keyword) ||
      String(item.width).includes(keyword) ||
      String(item.height).includes(keyword)
    );
  });
});

const onSubmit = async () => {
  if (!form.name) return showToast('请输入名称');
  await addItem({
    ...form,
    length: Number(form.length) || 0,
    width: Number(form.width) || 0,
    height: Number(form.height) || 0
  });
  Object.assign(form, { name: '', length: '', width: '', height: '' });
  showAddForm.value = false;
  showToast('添加成功');
};

const cancelAdd = () => {
  Object.assign(form, { name: '', length: '', width: '', height: '' });
  showAddForm.value = false;
};

const openEdit = (item: DimensionItem) => {
  editingItem.value = item;
  Object.assign(editForm, {
    name: item.name,
    length: String(item.length),
    width: String(item.width),
    height: String(item.height),
    unit: item.unit,
    category: item.category
  });
  showEditPopup.value = true;
};

const onEditSubmit = async () => {
  if (!editingItem.value || !editForm.name) return showToast('请输入名称');
  await updateItem(editingItem.value.id!, {
    ...editForm,
    length: Number(editForm.length) || 0,
    width: Number(editForm.width) || 0,
    height: Number(editForm.height) || 0
  });
  showEditPopup.value = false;
  showToast('修改成功');
};

const confirmDelete = (item: DimensionItem) => {
  deletingItem.value = item;
  showDeleteConfirm.value = true;
};

const handleDelete = async () => {
  if (!deletingItem.value) return;
  await deleteItem(deletingItem.value.id!);
  showDeleteConfirm.value = false;
  showToast('删除成功');
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f6f7;
  padding-bottom: 100px;
}

.search-section {
  padding: 16px;
  background-color: #f5f6f7;
}

.list-section {
  padding: 0 16px;
}

.add-form-section {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.inline-add-form {
  margin: 0;
}

.form-row {
  display: flex;
  gap: 8px;
}

.form-row .van-field {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: flex-end;
}

.list-item {
  margin-bottom: 12px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.swipe-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.edit-btn {
  height: 100%;
  width: 60px;
  border-radius: 0;
  margin-right: 0;
}

.delete-btn {
  height: 100%;
  width: 60px;
  border-radius: 0;
  margin-right: 0;
}

.empty-state {
  padding: 60px 0;
}

.bottom-action {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 400px;
}

.bottom-action .van-button {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(74, 108, 247, 0.3);
}

.edit-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333333;
}

.popup-header .van-icon {
  font-size: 20px;
  color: #999999;
}

.edit-form {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

:deep(.van-field__label) {
  color: #666666;
}

:deep(.van-button--primary) {
  background-color: #4a6cf7;
  border-color: #4a6cf7;
}

:deep(.van-button--danger) {
  background-color: #ff6b6b;
  border-color: #ff6b6b;
}
</style>
