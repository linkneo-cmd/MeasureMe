<template>
  <div class="app-container" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <div v-if="currentPage === 'home'" class="main-content">
      <div class="search-section">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索名称、分类、长、宽、高"
          background="#f5f6f7"
          shape="round"
          clearable
        />
        <div class="category-tags" v-if="allCategories.length > 0">
          <div class="category-tags-inner">
            <van-tag type="default" class="category-tag tag-all" @click="filterByCategory('')">全部</van-tag>
            <van-tag
              v-for="cat in displayCategories"
              :key="cat"
              :class="['category-tag', `tag-${getCategoryColorIndex(cat)}`]"
              :type="getCategoryType(cat)"
              @click="filterByCategory(cat)"
            >
              {{ cat }}
            </van-tag>
            <van-tag
              v-if="showMoreTag"
              class="category-tag tag-more"
              type="default"
              @click="toggleCategories"
            >
              <van-icon :name="showAllCategories ? 'arrow-down' : 'more-o'" size="14" />
            </van-tag>
          </div>
        </div>
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
            <van-field
              v-model="form.category"
              label="分类"
              placeholder="未分类"
            />
            <div class="form-row">
              <van-field v-model="form.length" label="长" type="digit" placeholder="0" />
              <van-field v-model="form.width" label="宽" type="digit" placeholder="0" />
              <van-field v-model="form.height" label="高" type="digit" placeholder="0" />
            </div>
            <div class="image-upload-section">
              <div class="image-grid">
                <div
                  v-for="(photo, index) in form.photos"
                  :key="index"
                  class="image-item"
                  @click="previewImage(photo)"
                >
                  <img :src="photo" class="image-thumb" />
                  <van-icon name="cross" class="image-delete" @click.stop="removeFormPhoto(index)" />
                </div>
                <div
                  v-if="form.photos.length < 6"
                  class="image-upload-btn"
                  @click="triggerUpload('add')"
                >
                  <van-icon name="plus" size="24" />
                </div>
              </div>
            </div>
            <input
              ref="addFileInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden-input"
              @change="handleAddFileChange"
            />
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
          left-width="120"
        >
          <van-cell
            :title="item.name"
            :label="`${item.length} × ${item.width} × ${item.height} cm`"
            class="list-item"
            @click="openDetail(item)"
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
        <div style="margin-top:5px; font-size: 12px; color: #999;">-Author: NeoZhy</div>
      </div>
    </div>

    <QrScanner v-if="currentPage === 'qr-scanner'" @back="goHome" />

    <van-popup
      v-model:show="showDrawer"
      position="left"
      :style="{ width: '75%', height: '100%' }"
      round
    >
      <div class="drawer-content">
        <div class="drawer-header">
          <h2>功能菜单</h2>
        </div>
        <van-cell-group inset class="drawer-menu">
          <van-cell title="尺寸记录" icon="records-o" @click="goHome" />
          <van-cell title="二维码解析" icon="qr" @click="goToQrScanner" />
        </van-cell-group>
      </div>
    </van-popup>

    <van-popup
      v-model:show="showEditPopup"
      position="bottom"
      :style="{ height: '70%' }"
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
          <van-field
            v-model="editForm.category"
            label="分类"
            placeholder="未分类"
          />
          <div class="form-row">
            <van-field v-model="editForm.length" label="长" type="digit" placeholder="0" />
            <van-field v-model="editForm.width" label="宽" type="digit" placeholder="0" />
            <van-field v-model="editForm.height" label="高" type="digit" placeholder="0" />
          </div>
          <div class="image-upload-section">
            <div class="image-grid">
              <div
                v-for="(photo, index) in editForm.photos"
                :key="index"
                class="image-item"
                @click="previewImage(photo)"
              >
                <img :src="photo" class="image-thumb" />
                <van-icon name="cross" class="image-delete" @click.stop="removeEditPhoto(index)" />
              </div>
              <div
                v-if="editForm.photos.length < 6"
                class="image-upload-btn"
                @click="triggerUpload('edit')"
              >
                <van-icon name="plus" size="24" />
              </div>
            </div>
          </div>
          <input
            ref="editFileInput"
            type="file"
            accept="image/*"
            multiple
            class="hidden-input"
            @change="handleEditFileChange"
          />
          <van-button type="primary" native-type="submit" block>保存修改</van-button>
        </van-form>
      </div>
    </van-popup>

    <van-popup
      v-model:show="showDetailPopup"
      position="center"
      :style="{ width: '90%', maxWidth: '400px', borderRadius: '16px' }"
    >
      <div class="detail-popup">
        <div class="popup-header">
          <h3>{{ detailItem?.name }}</h3>
          <van-icon name="cross" @click="showDetailPopup = false" />
        </div>
        <div class="detail-content" v-if="detailItem">
          <div class="detail-info">
            <div class="info-row">
              <span class="info-label">尺寸</span>
              <span class="info-value">{{ detailItem.length }} × {{ detailItem.width }} × {{ detailItem.height }} cm</span>
            </div>
            <div class="info-row">
              <span class="info-label">分类</span>
              <van-tag :type="getCategoryType(detailItem.category)">
                {{ detailItem.category }}
              </van-tag>
            </div>
            <div class="info-row">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ formatDate(detailItem.createdAt) }}</span>
            </div>
          </div>
          <div v-if="detailItem.photos && detailItem.photos.length > 0" class="detail-images">
            <div class="image-grid">
              <div
                v-for="(photo, index) in detailItem.photos"
                :key="index"
                class="image-item"
                @click="previewImage(photo)"
              >
                <img :src="photo" class="image-thumb" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <div v-if="showImagePreview" class="image-preview-overlay" @click="closeImagePreview">
      <img :src="previewImageUrl" class="preview-image" @click.stop />
    </div>

    <van-dialog
      v-model:show="showDeleteConfirm"
      title="确认删除"
      message="确定要删除这条记录吗？"
      confirm-button-text="删除"
      cancel-button-text="取消"
      confirm-button-color="#ff6b6b"
      @confirm="handleDelete"
    />

    <div
      ref="triggerRef"
      class="drawer-trigger" 
      @click="showDrawer = true"
    >
      <van-icon name="bars" size="24" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useDimensions } from '@/composables/useDimensions';
import { showToast } from 'vant';
import type { DimensionItem } from '@/db/dexie';
import { compressImages } from '@/utils/imageCompressor';
import QrScanner from '@/pages/QrScanner.vue';

const { items, addItem, deleteItem, updateItem } = useDimensions();

const currentPage = ref<'home' | 'qr-scanner'>('home');
const showDrawer = ref(false);

const searchKeyword = ref('');
const selectedCategory = ref('');
const showAddForm = ref(false);

const form = reactive({
  name: '',
  length: '',
  width: '',
  height: '',
  unit: 'cm',
  category: '',
  photos: [] as string[]
});

const addFileInput = ref<HTMLInputElement | null>(null);
const editFileInput = ref<HTMLInputElement | null>(null);

const showEditPopup = ref(false);
const editingItem = ref<DimensionItem | null>(null);
const editForm = reactive({
  name: '',
  length: '',
  width: '',
  height: '',
  unit: 'cm',
  category: '',
  photos: [] as string[]
});

const showDetailPopup = ref(false);
const detailItem = ref<DimensionItem | null>(null);

const showImagePreview = ref(false);
const previewImageUrl = ref('');

const showDeleteConfirm = ref(false);
const deletingItem = ref<DimensionItem | null>(null);

const showAllCategories = ref(false);
const MAX_DISPLAY_CATEGORIES = 8;

const startX = ref(0);
const startY = ref(0);
const isTouching = ref(false);
const SWIPE_THRESHOLD = 80;
const EDGE_THRESHOLD = 50;

const allCategories = computed(() => {
  const cats = [...new Set(items.value.map(item => item.category))];
  return cats.length > 0 ? cats : [];
});

const displayCategories = computed(() => {
  if (showAllCategories.value) return allCategories.value;
  return allCategories.value.slice(0, MAX_DISPLAY_CATEGORIES);
});

const showMoreTag = computed(() => {
  return allCategories.value.length > MAX_DISPLAY_CATEGORIES;
});

const getCategoryColorIndex = (category: string) => {
  const colors = ['primary', 'success', 'warning', 'info', 'danger'];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getCategoryType = (category: string): 'primary' | 'success' | 'warning' | 'danger' | 'default' => {
  const colors = ['primary', 'success', 'warning', 'danger'] as const;
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] || 'default';
};

const filteredItems = computed(() => {
  let result = items.value;
  
  if (selectedCategory.value) {
    result = result.filter(item => item.category === selectedCategory.value);
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(item => {
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword) ||
        String(item.length).includes(keyword) ||
        String(item.width).includes(keyword) ||
        String(item.height).includes(keyword)
      );
    });
  }
  
  return result;
});

const handleTouchStart = (e: TouchEvent) => {
  if (currentPage.value !== 'home') return;
  const touch = e.touches[0];
  startX.value = touch.clientX;
  startY.value = touch.clientY;
  isTouching.value = true;
};

const handleTouchMove = () => {
};

const handleTouchEnd = (e: TouchEvent) => {
  if (!isTouching.value || currentPage.value !== 'home') return;
  isTouching.value = false;
  
  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - startX.value;
  const deltaY = touch.clientY - startY.value;
  
  if (startX.value <= EDGE_THRESHOLD && deltaX > SWIPE_THRESHOLD && Math.abs(deltaY) < Math.abs(deltaX)) {
    showDrawer.value = true;
  }
};

const goHome = () => {
  showDrawer.value = false;
  currentPage.value = 'home';
};

const goToQrScanner = () => {
  showDrawer.value = false;
  currentPage.value = 'qr-scanner';
};

const filterByCategory = (category: string) => {
  if (selectedCategory.value === category) {
    selectedCategory.value = '';
  } else {
    selectedCategory.value = category;
  }
};

const toggleCategories = () => {
  showAllCategories.value = !showAllCategories.value;
};

const formatDate = (date: Date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const triggerUpload = (type: 'add' | 'edit') => {
  if (type === 'add' && addFileInput.value) {
    addFileInput.value.click();
  } else if (type === 'edit' && editFileInput.value) {
    editFileInput.value.click();
  }
};

const handleAddFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (files.length === 0) return;

  const remaining = 6 - form.photos.length;
  const selectedFiles = files.slice(0, remaining);

  try {
    showToast({ message: '正在压缩图片...', duration: 0 });
    const compressedPhotos = await compressImages(selectedFiles);
    form.photos.push(...compressedPhotos);
    showToast({ message: '图片上传成功', duration: 1500 });
  } catch {
    showToast('图片处理失败');
  }

  input.value = '';
};

const handleEditFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (files.length === 0) return;

  const remaining = 6 - editForm.photos.length;
  const selectedFiles = files.slice(0, remaining);

  try {
    showToast({ message: '正在压缩图片...', duration: 0 });
    const compressedPhotos = await compressImages(selectedFiles);
    editForm.photos.push(...compressedPhotos);
    showToast({ message: '图片上传成功', duration: 1500 });
  } catch {
    showToast('图片处理失败');
  }

  input.value = '';
};

const removeFormPhoto = (index: number) => {
  form.photos.splice(index, 1);
};

const removeEditPhoto = (index: number) => {
  editForm.photos.splice(index, 1);
};

const previewImage = (url: string) => {
  previewImageUrl.value = url;
  showImagePreview.value = true;
};

const closeImagePreview = () => {
  showImagePreview.value = false;
  previewImageUrl.value = '';
};

const onSubmit = async () => {
  if (!form.name) return showToast('请输入名称');
  await addItem({
    ...form,
    length: Number(form.length) || 0,
    width: Number(form.width) || 0,
    height: Number(form.height) || 0,
    category: form.category || '未分类',
    photos: [...form.photos]
  });
  Object.assign(form, { name: '', length: '', width: '', height: '', category: '', photos: [] });
  showAddForm.value = false;
  showToast('添加成功');
};

const cancelAdd = () => {
  Object.assign(form, { name: '', length: '', width: '', height: '', category: '', photos: [] });
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
    category: item.category,
    photos: [...(item.photos || [])]
  });
  showEditPopup.value = true;
};

const onEditSubmit = async () => {
  if (!editingItem.value || !editForm.name) return showToast('请输入名称');
  await updateItem(editingItem.value.id!, {
    ...editForm,
    length: Number(editForm.length) || 0,
    width: Number(editForm.width) || 0,
    height: Number(editForm.height) || 0,
    category: editForm.category || '未分类',
    photos: [...editForm.photos]
  });
  showEditPopup.value = false;
  showToast('修改成功');
};

const openDetail = (item: DimensionItem) => {
  detailItem.value = item;
  showDetailPopup.value = true;
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
.app-container {
  min-height: 100vh;
  background-color: #f5f6f7;
}

.main-content {
  padding-bottom: 100px;
}

.drawer-trigger {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  left: 16px;
  z-index: 100;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-section {
  padding: 16px;
  background-color: #f5f6f7;
}

.category-tags {
  margin-top: 12px;
}

.category-tags-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 72px;
  overflow: hidden;
}

.category-tag {
  cursor: pointer;
}

.tag-more {
  background-color: #f0f0f0 !important;
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

.image-upload-section {
  margin: 16px 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.image-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  border-radius: 50%;
  padding: 2px;
  font-size: 14px;
}

.image-upload-btn {
  aspect-ratio: 1;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999999;
  background-color: #fafafa;
}

.hidden-input {
  display: none;
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
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 400px;
}

.bottom-action .van-button {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(74, 108, 247, 0.3);
}

.drawer-content {
  height: 100%;
  background-color: #fff;
}

.drawer-header {
  background-color: #4a6cf7;
  padding: 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.drawer-menu {
  margin-top: 16px;
}

.edit-popup,
.detail-popup {
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

.detail-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.detail-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-label {
  color: #999999;
  font-size: 14px;
}

.info-value {
  color: #333333;
  font-size: 14px;
  font-weight: 500;
}

.detail-images {
  margin-top: 16px;
}

.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.preview-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
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

:deep(.van-cell--clickable:active) {
  background-color: #f5f5f5;
}

:deep(.drawer-content .van-cell:after) {
  border-bottom: 0.5px solid;
}
</style>
