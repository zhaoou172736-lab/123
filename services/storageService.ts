import { SavedAnalysis, Category } from '../types';

const STORAGE_KEY = 'viral_architect_history_v1';
const CATEGORY_KEY = 'viral_architect_categories_v1';

export const getHistory = (): SavedAnalysis[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to load history", e);
        return [];
    }
};

export const saveAnalysisItem = (item: SavedAnalysis) => {
    try {
        const history = getHistory();
        // Remove existing item with same ID if exists to update it, then add to top
        const existingIndex = history.findIndex(i => i.id === item.id);
        let newItem = { ...item };
        
        const newHistory = [newItem, ...history.filter(i => i.id !== item.id)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {
        console.error("Failed to save item", e);
        alert("保存失败，可能是本地存储空间不足。");
    }
};

export const deleteAnalysisItem = (id: string) => {
    try {
        const history = getHistory().filter(i => i.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        console.error("Failed to delete item", e);
    }
};

// --- Category Management ---

export const getCategories = (): Category[] => {
    try {
        const data = localStorage.getItem(CATEGORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

export const saveCategory = (category: Category) => {
    const cats = getCategories();
    const idx = cats.findIndex(c => c.id === category.id);
    if (idx >= 0) {
        cats[idx] = category;
    } else {
        cats.push(category);
    }
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(cats));
};

export const deleteCategory = (id: string) => {
    const cats = getCategories().filter(c => c.id !== id);
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(cats));
    
    // Move items to uncategorized
    const history = getHistory();
    const newHistory = history.map(item => {
        if (item.categoryId === id) {
            const { categoryId, ...rest } = item;
            return rest;
        }
        return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
};

// --- Backup & Restore ---

export interface BackupData {
    version: number;
    timestamp: number;
    categories: Category[];
    history: SavedAnalysis[];
}

export const exportBackup = (): string => {
    const backup: BackupData = {
        version: 1,
        timestamp: Date.now(),
        categories: getCategories(),
        history: getHistory()
    };
    return JSON.stringify(backup, null, 2);
};

export const importBackup = (jsonString: string): { success: boolean; count: number; message: string } => {
    try {
        const backup: BackupData = JSON.parse(jsonString);
        
        // Basic validation
        if (!Array.isArray(backup.history) || !Array.isArray(backup.categories)) {
            return { success: false, count: 0, message: "文件格式错误：缺少历史记录或分类数据。" };
        }

        // 1. Merge Categories
        const currentCategories = getCategories();
        const categoryMap = new Map(currentCategories.map(c => [c.id, c]));
        backup.categories.forEach(c => categoryMap.set(c.id, c)); // Overwrite if exists, add if new
        localStorage.setItem(CATEGORY_KEY, JSON.stringify(Array.from(categoryMap.values())));

        // 2. Merge History
        const currentHistory = getHistory();
        const historyMap = new Map(currentHistory.map(h => [h.id, h]));
        backup.history.forEach(h => historyMap.set(h.id, h)); // Overwrite if exists, add if new
        
        // Convert map back to array and sort by timestamp desc
        const mergedHistory = Array.from(historyMap.values()).sort((a, b) => b.timestamp - a.timestamp);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedHistory));

        return { success: true, count: backup.history.length, message: `成功导入 ${backup.history.length} 条记录` };
    } catch (e) {
        console.error("Import failed", e);
        return { success: false, count: 0, message: "解析失败：JSON 文件可能已损坏。" };
    }
};