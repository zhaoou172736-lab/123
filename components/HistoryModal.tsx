import React, { useEffect, useState, useRef } from 'react';
import { SavedAnalysis, Category } from '../types';
import { getHistory, deleteAnalysisItem, getCategories, saveCategory, deleteCategory, saveAnalysisItem, exportBackup, importBackup } from '../services/storageService';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoad: (item: SavedAnalysis) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onLoad }) => {
    const [history, setHistory] = useState<SavedAnalysis[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    
    // File input ref for images
    const fileInputRef = useRef<HTMLInputElement>(null);
    // File input ref for backup import
    const backupInputRef = useRef<HTMLInputElement>(null);
    const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            refreshData();
        }
    }, [isOpen]);

    const refreshData = () => {
        setHistory(getHistory());
        setCategories(getCategories());
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('确定要删除这条作品记录吗？此操作无法撤销。')) {
            deleteAnalysisItem(id);
            setHistory(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        const newCat: Category = {
            id: Date.now().toString(),
            name: newCategoryName.trim()
        };
        saveCategory(newCat);
        setCategories([...categories, newCat]);
        setNewCategoryName('');
    };

    const handleDeleteCategory = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('删除此博主归档会将该名下的记录移动至“未归档”，确定删除吗？')) {
            deleteCategory(id);
            setCategories(categories.filter(c => c.id !== id));
            if (selectedCategoryId === id) setSelectedCategoryId('all');
            refreshData(); 
        }
    };

    const startEditingCategory = (cat: Category, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCategoryId(cat.id);
        setEditingName(cat.name);
    };

    const saveEditingCategory = () => {
        if (editingCategoryId && editingName.trim()) {
            saveCategory({ id: editingCategoryId, name: editingName.trim() });
            setCategories(categories.map(c => c.id === editingCategoryId ? { ...c, name: editingName.trim() } : c));
        }
        setEditingCategoryId(null);
    };

    const moveItemToCategory = (item: SavedAnalysis, newCatId: string) => {
        const updatedItem = { ...item, categoryId: newCatId === 'uncategorized' ? undefined : newCatId };
        saveAnalysisItem(updatedItem);
        setHistory(history.map(h => h.id === item.id ? updatedItem : h));
    };

    // --- Image Handling Logic ---

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    // Resize to width 400px to save LocalStorage space
                    const maxWidth = 400; 
                    const scale = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    // Compress to JPEG 0.7 quality
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const triggerUpload = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveUploadId(id);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset input
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeUploadId) {
            const file = e.target.files[0];
            try {
                const base64Thumbnail = await compressImage(file);
                const itemToUpdate = history.find(h => h.id === activeUploadId);
                if (itemToUpdate) {
                    const updatedItem = { ...itemToUpdate, thumbnail: base64Thumbnail };
                    saveAnalysisItem(updatedItem);
                    setHistory(history.map(h => h.id === activeUploadId ? updatedItem : h));
                }
            } catch (error) {
                console.error("Image processing failed", error);
                alert("图片处理失败，请重试");
            } finally {
                setActiveUploadId(null);
            }
        }
    };

    const handleDeleteImage = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('确定要移除这张照片吗？')) {
            const itemToUpdate = history.find(h => h.id === id);
            if (itemToUpdate) {
                const updatedItem = { ...itemToUpdate, thumbnail: undefined };
                saveAnalysisItem(updatedItem);
                setHistory(history.map(h => h.id === id ? updatedItem : h));
                // Clear input value to ensure change event fires if same file selected again later
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    // --- Backup & Restore Logic ---

    const handleExportBackup = () => {
        const jsonStr = exportBackup();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `ViralArchitect_Backup_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const triggerImportBackup = () => {
        if (backupInputRef.current) {
            backupInputRef.current.value = '';
            backupInputRef.current.click();
        }
    };

    const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                const result = importBackup(content);
                if (result.success) {
                    alert(`✅ ${result.message}\n数据已合并到现有记录中。`);
                    refreshData();
                } else {
                    alert(`❌ ${result.message}`);
                }
            };
            reader.readAsText(file);
        }
    };

    const filteredHistory = history.filter(item => {
        if (selectedCategoryId === 'all') return true;
        if (selectedCategoryId === 'uncategorized') return !item.categoryId;
        return item.categoryId === selectedCategoryId;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in p-4" onClick={onClose}>
            <div className="bg-white h-[85vh] w-full max-w-5xl shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                
                {/* Hidden File Inputs */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <input 
                    type="file" 
                    ref={backupInputRef} 
                    className="hidden" 
                    accept=".json"
                    onChange={handleBackupFileChange}
                />

                {/* Sidebar: Categories */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-100/50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <i className="fas fa-user-tag text-orange-500"></i> 博主拆解
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button 
                            onClick={() => setSelectedCategoryId('all')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between items-center ${selectedCategoryId === 'all' ? 'bg-orange-100 text-orange-800' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <span><i className="fas fa-layer-group w-5 text-center mr-1"></i> 全部记录</span>
                            <span className="bg-slate-200/50 px-1.5 py-0.5 rounded text-xs text-slate-500">{history.length}</span>
                        </button>
                        
                        <button 
                            onClick={() => setSelectedCategoryId('uncategorized')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between items-center ${selectedCategoryId === 'uncategorized' ? 'bg-orange-100 text-orange-800' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <span><i className="fas fa-inbox w-5 text-center mr-1"></i> 未归档</span>
                            <span className="bg-slate-200/50 px-1.5 py-0.5 rounded text-xs text-slate-500">{history.filter(h => !h.categoryId).length}</span>
                        </button>
                        
                        <div className="my-2 border-t border-slate-200"></div>
                        
                        {categories.map(cat => (
                            <div 
                                key={cat.id} 
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition ${selectedCategoryId === cat.id ? 'bg-white shadow-sm border border-slate-200 text-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                {editingCategoryId === cat.id ? (
                                    <input 
                                        autoFocus
                                        className="w-full bg-white border border-blue-400 rounded px-1 py-0.5 text-xs outline-none"
                                        value={editingName}
                                        onChange={e => setEditingName(e.target.value)}
                                        onBlur={saveEditingCategory}
                                        onKeyDown={e => e.key === 'Enter' && saveEditingCategory()}
                                        onClick={e => e.stopPropagation()}
                                    />
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <i className="fas fa-user-circle text-amber-400"></i>
                                            <span className="truncate">{cat.name}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={(e) => startEditingCategory(cat, e)} className="p-1 hover:text-blue-500 text-slate-400" title="重命名">
                                                <i className="fas fa-pencil-alt text-xs"></i>
                                            </button>
                                            <button onClick={(e) => handleDeleteCategory(cat.id, e)} className="p-1 hover:text-red-500 text-slate-400" title="删除博主">
                                                <i className="fas fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-3 border-t border-slate-200 bg-white space-y-3">
                        {/* Add Category */}
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="新建博主..." 
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-orange-400"
                            />
                            <button onClick={handleAddCategory} className="bg-slate-800 text-white px-3 rounded-lg text-xs hover:bg-black transition">
                                <i className="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        {/* Data Management Section */}
                        <div className="pt-2 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 pl-1">数据安全</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={handleExportBackup}
                                    className="flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                    <i className="fas fa-file-export"></i> 导出备份
                                </button>
                                <button 
                                    onClick={triggerImportBackup}
                                    className="flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                    <i className="fas fa-file-import"></i> 恢复备份
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: List */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                        <h3 className="font-bold text-xl text-slate-800">
                            {selectedCategoryId === 'all' ? '全部记录' : 
                             selectedCategoryId === 'uncategorized' ? '未归档' : 
                             categories.find(c => c.id === selectedCategoryId)?.name || '未知博主'}
                        </h3>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        {filteredHistory.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <i className="fas fa-folder-open text-6xl mb-4 text-slate-200"></i>
                                <p>该博主下暂无拆解记录</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredHistory.map((item) => (
                                    <div 
                                        key={item.id}
                                        className="bg-white rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
                                    >
                                        {/* Thumbnail Section */}
                                        <div className="relative w-full aspect-[3/4] bg-slate-100 border-b border-slate-100 group/image rounded-t-xl overflow-hidden">
                                            {item.thumbnail ? (
                                                <>
                                                    <img 
                                                        src={item.thumbnail} 
                                                        alt="Cover" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/image:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity duration-200 backdrop-blur-sm">
                                                        <button 
                                                            onClick={(e) => handleDeleteImage(item.id, e)}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg transform transition active:scale-95 flex items-center gap-1"
                                                        >
                                                            <i className="fas fa-trash-alt"></i> 删除照片
                                                        </button>
                                                        <button 
                                                            onClick={(e) => triggerUpload(item.id, e)}
                                                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur transform transition active:scale-95 flex items-center gap-1"
                                                        >
                                                            <i className="fas fa-image"></i> 更换照片
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div 
                                                    onClick={(e) => triggerUpload(item.id, e)}
                                                    className="w-full h-full flex flex-col items-center justify-center text-slate-300 hover:bg-slate-200 hover:text-slate-500 cursor-pointer transition-colors"
                                                >
                                                    <div className="w-10 h-10 border-2 border-dashed border-current rounded-lg flex items-center justify-center mb-2">
                                                        <i className="fas fa-plus"></i>
                                                    </div>
                                                    <span className="text-xs font-medium">添加作品封面</span>
                                                </div>
                                            )}
                                        </div>

                                        <div 
                                            onClick={() => { onLoad(item); onClose(); }}
                                            className="p-4 flex-1 cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight hover:text-orange-600 transition" title={item.title}>
                                                    {item.title || "未命名项目"}
                                                </h4>
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono mb-3">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 font-medium">
                                                    {item.inputs.niche || "未定义赛道"}
                                                </span>
                                                <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded text-xs font-bold">
                                                    {item.scriptTable.length} 镜头
                                                </span>
                                            </div>
                                        </div>

                                        <div className="px-4 py-3 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center rounded-b-xl">
                                            {/* Classification Dropdown */}
                                            <div className="relative group/folder">
                                                <button className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200">
                                                    <i className="fas fa-user-tag"></i>
                                                    {categories.find(c => c.id === item.categoryId)?.name || '未归档'}
                                                </button>
                                                {/* Added pb-2 padding-bottom to bridge the hover gap */}
                                                <div className="absolute left-0 bottom-full w-40 pb-1 hidden group-hover/folder:block z-50">
                                                    <div className="bg-white rounded-lg shadow-xl border border-slate-100 py-1">
                                                        <button 
                                                            onClick={() => moveItemToCategory(item, 'uncategorized')}
                                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 ${!item.categoryId ? 'text-orange-600 font-bold' : 'text-slate-600'}`}
                                                        >
                                                            未归档
                                                        </button>
                                                        {categories.map(cat => (
                                                            <button 
                                                                key={cat.id}
                                                                onClick={() => moveItemToCategory(item, cat.id)}
                                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 ${item.categoryId === cat.id ? 'text-orange-600 font-bold' : 'text-slate-600'}`}
                                                            >
                                                                {cat.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={(e) => handleDelete(item.id, e)}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded transition text-xs flex items-center gap-1"
                                                title="删除作品"
                                            >
                                                <i className="fas fa-trash-alt"></i> 删除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;