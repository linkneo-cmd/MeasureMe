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
  photoPath?: string;     // 图片本地路径
  createdAt: Date;
}

export class MyDatabase extends Dexie {
  items!: Table<DimensionItem>;

  constructor() {
    super('DimensionsDB');
    this.version(1).stores({
      items: '++id, name, category, createdAt'
    });
  }
}

export const db = new MyDatabase();