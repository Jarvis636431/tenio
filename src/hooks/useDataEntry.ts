
import { useState, useCallback, useEffect } from "react";

export interface DataEntry {
  date: string;
  value: number;
  notes?: string;
  timestamp: number;
}

export interface DataEntryState {
  [category: string]: {
    [type: string]: DataEntry[];
  };
}

const STORAGE_KEY = "project_data_entries";

export function useDataEntry() {
  const [dataEntries, setDataEntries] = useState<DataEntryState>({});

  // 从 localStorage 加载数据
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setDataEntries(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load data entries:", error);
    }
  }, []);

  // 保存数据到 localStorage
  const saveToStorage = useCallback((data: DataEntryState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save data entries:", error);
    }
  }, []);

  // 添加数据条目
  const addDataEntry = useCallback((
    category: string,
    type: string,
    entry: Omit<DataEntry, "timestamp">
  ) => {
    const newEntry: DataEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    setDataEntries(prev => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          [type]: [
            ...(prev[category]?.[type] || []).filter(e => e.date !== entry.date),
            newEntry,
          ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        },
      };
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // 获取特定类型的数据条目
  const getDataEntries = useCallback((category: string, type: string): DataEntry[] => {
    return dataEntries[category]?.[type] || [];
  }, [dataEntries]);

  // 删除数据条目
  const deleteDataEntry = useCallback((
    category: string,
    type: string,
    date: string
  ) => {
    setDataEntries(prev => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          [type]: (prev[category]?.[type] || []).filter(e => e.date !== date),
        },
      };
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // 合并用户录入数据和默认数据
  const mergeWithDefaultData = useCallback((
    defaultData: Array<{ date: string; value: number; plan: number }>,
    userEntries: DataEntry[]
  ) => {
    const userEntriesMap = new Map(userEntries.map(entry => [entry.date, entry]));
    
    return defaultData.map(item => ({
      ...item,
      value: userEntriesMap.get(item.date)?.value ?? item.value,
      isUserEntry: userEntriesMap.has(item.date),
    }));
  }, []);

  return {
    addDataEntry,
    getDataEntries,
    deleteDataEntry,
    mergeWithDefaultData,
  };
}
