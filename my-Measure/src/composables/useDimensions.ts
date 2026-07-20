import { ref, onMounted } from 'vue';
import { db, type DimensionItem } from '@/db/dexie';

export function useDimensions() {
  const items = ref<DimensionItem[]>([]);

  const loadItems = async () => {
    items.value = await db.items.toArray();
    console.log("加载了items", items.value);
  };

  const addItem = async (item: Omit<DimensionItem, 'id' | 'createdAt'>) => {
    await db.items.add({
      ...item,
      createdAt: new Date()
    });
    await loadItems();
  };

  const deleteItem = async (id: number) => {
    await db.items.delete(id);
    await loadItems();
  };

  const updateItem = async (id: number, item: Partial<DimensionItem>) => {
    await db.items.update(id, item);
    await loadItems();
  };

  onMounted(loadItems);

  return { items, addItem, deleteItem, updateItem, loadItems };
}