import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface DimensionItem {
  id?: number;
  name: string;           // 物品名称
  category: string;       // 分类
  length: number;
  width: number;
  height: number;
  unit: string;           // 默认 cm
  photos: string[];       // 图片base64数组
  createdAt: Date;
}

export class MyDatabase extends Dexie {
  items!: Table<DimensionItem>;

  constructor() {
    super('DimensionsDB');
    this.version(1).stores({
      items: '++id, name, category, createdAt'
    });
    this.version(2).stores({
      items: '++id, name, category, createdAt'
    }).upgrade((trans) => {
      trans.table('items').toCollection().modify((item: any) => {
        if (!item.photos) {
          item.photos = item.photoPath ? [item.photoPath] : [];
        }
      });
    });
  }
}

export const db = new MyDatabase();