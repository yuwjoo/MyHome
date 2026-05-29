// 云盘相关API模拟
// 实际项目中应替换为真实的阿里云OSS API调用

import type { Folder, File } from "./types/cloud-disk";

// 模拟存储数据
const mockFolders: Folder[] = [
  {
    id: "folder_1",
    name: "文档",
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    parentId: "root"
  },
  {
    id: "folder_2",
    name: "图片",
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    parentId: "root"
  },
  {
    id: "folder_3",
    name: "视频",
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    parentId: "root"
  }
];

const mockFiles: File[] = [
  {
    id: "file_1",
    name: "项目计划书.pdf",
    type: "application/pdf",
    size: 2097152, // 2MB
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    url: "https://via.placeholder.com/150", // 模拟URL
    parentId: "root"
  },
  {
    id: "file_2",
    name: "工作总结.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 5242880, // 5MB
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    url: "https://via.placeholder.com/150",
    parentId: "root"
  },
  {
    id: "file_3",
    name: "照片.jpg",
    type: "image/jpeg",
    size: 1048576, // 1MB
    updatedAt: new Date(Date.now() - 10800000).toISOString(),
    url: "https://via.placeholder.com/150",
    parentId: "root"
  }
];

// 存储统计信息
const totalStorage = 50 * 1024 * 1024 * 1024; // 50GB

/**
 * 获取文件列表
 * @param parentId 父文件夹ID，默认为根目录
 * @returns 包含文件夹和文件的对象
 */
export const getFileList = async (parentId = "root"): Promise<{ folders: Folder[]; files: File[] }> => {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    folders: mockFolders.filter((folder) => folder.parentId === parentId),
    files: mockFiles.filter((file) => file.parentId === parentId)
  };
};

/**
 * 创建文件夹
 * @param folderData 文件夹数据
 * @returns 创建的文件夹对象
 */
export const createFolder = async (folderData: Omit<Folder, "id" | "updatedAt">): Promise<Folder> => {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 检查文件夹是否已存在
  const folderExists = mockFolders.some(
    (folder) => folder.name === folderData.name && folder.parentId === folderData.parentId
  );

  if (folderExists) {
    throw new Error("文件夹已存在");
  }

  const newFolder: Folder = {
    id: `folder_${Date.now()}`,
    ...folderData,
    updatedAt: new Date().toISOString()
  };

  mockFolders.push(newFolder);
  return newFolder;
};

/**
 * 上传文件
 * @param file 文件对象
 * @param parentId 父文件夹ID
 * @returns 上传后的文件信息
 */
export const uploadFile = async (file: File, parentId = "root"): Promise<File> => {
  // 模拟API延迟（模拟上传时间）
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 检查文件是否已存在
  const fileExists = mockFiles.some((f) => f.name === file.name && f.parentId === parentId);

  if (fileExists) {
    throw new Error("文件已存在");
  }

  // 模拟文件上传后的URL
  const fileUrl = URL.createObjectURL(new Blob([], { type: file.type }));

  const newFile: File = {
    id: `file_${Date.now()}`,
    name: file.name,
    type: file.type,
    size: file.size,
    url: fileUrl,
    parentId,
    updatedAt: new Date().toISOString()
  };

  mockFiles.push(newFile);
  return newFile;
};

/**
 * 下载文件
 * @param fileId 文件ID
 * @returns 文件下载URL
 */
export const downloadFile = async (fileId: string): Promise<string> => {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  const file = mockFiles.find((f) => f.id === fileId);

  if (!file) {
    throw new Error("文件不存在");
  }

  // 在实际项目中，这里应该生成一个带签名的临时URL
  return file.url;
};

/**
 * 删除文件或文件夹
 * @param id 文件或文件夹ID
 * @param type 类型：file 或 folder
 */
export const deleteItem = async (id: string, type: "file" | "folder"): Promise<void> => {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (type === "file") {
    const fileIndex = mockFiles.findIndex((f) => f.id === id);
    if (fileIndex === -1) {
      throw new Error("文件不存在");
    }
    mockFiles.splice(fileIndex, 1);
  } else {
    // 检查文件夹是否存在
    const folder = mockFolders.find((f) => f.id === id);
    if (!folder) {
      throw new Error("文件夹不存在");
    }

    // 检查文件夹是否为空
    const hasSubfolders = mockFolders.some((f) => f.parentId === id);
    const hasFiles = mockFiles.some((f) => f.parentId === id);

    if (hasSubfolders || hasFiles) {
      throw new Error("文件夹不为空");
    }

    // 删除文件夹
    const folderIndex = mockFolders.findIndex((f) => f.id === id);
    mockFolders.splice(folderIndex, 1);
  }
};

/**
 * 获取存储空间信息
 * @returns 存储空间信息
 */
export const getStorageInfo = async (): Promise<{ used: number; total: number }> => {
  // 计算已用空间
  const usedStorage = mockFiles.reduce((sum, file) => sum + file.size, 0);

  return {
    used: usedStorage,
    total: totalStorage
  };
};

/**
 * 重命名文件或文件夹
 * @param id 文件或文件夹ID
 * @param newName 新名称
 * @param type 类型：file 或 folder
 */
export const renameItem = async (id: string, newName: string, type: "file" | "folder"): Promise<void> => {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (type === "file") {
    const file = mockFiles.find((f) => f.id === id);
    if (!file) {
      throw new Error("文件不存在");
    }

    // 检查新名称是否已存在
    const nameExists = mockFiles.some((f) => f.name === newName && f.id !== id && f.parentId === file.parentId);

    if (nameExists) {
      throw new Error("文件名已存在");
    }

    file.name = newName;
    file.updatedAt = new Date().toISOString();
  } else {
    const folder = mockFolders.find((f) => f.id === id);
    if (!folder) {
      throw new Error("文件夹不存在");
    }

    // 检查新名称是否已存在
    const nameExists = mockFolders.some((f) => f.name === newName && f.id !== id && f.parentId === folder.parentId);

    if (nameExists) {
      throw new Error("文件夹名已存在");
    }

    folder.name = newName;
    folder.updatedAt = new Date().toISOString();
  }
};

/**
 * 移动文件或文件夹
 * @param id 文件或文件夹ID
 * @param newParentId 新的父文件夹ID
 * @param type 类型：file 或 folder
 */
export const moveItem = async (id: string, newParentId: string, type: "file" | "folder"): Promise<void> => {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 检查目标文件夹是否存在
  const targetFolder = mockFolders.find((f) => f.id === newParentId) || (newParentId === "root" ? true : false);
  if (!targetFolder) {
    throw new Error("目标文件夹不存在");
  }

  if (type === "file") {
    const file = mockFiles.find((f) => f.id === id);
    if (!file) {
      throw new Error("文件不存在");
    }

    file.parentId = newParentId;
    file.updatedAt = new Date().toISOString();
  } else {
    const folder = mockFolders.find((f) => f.id === id);
    if (!folder) {
      throw new Error("文件夹不存在");
    }

    // 检查是否会形成循环引用
    if (newParentId !== "root") {
      let currentFolderId = newParentId;
      while (currentFolderId !== "root") {
        const currentFolder = mockFolders.find((f) => f.id === currentFolderId);
        if (!currentFolder) break;
        if (currentFolder.id === folder.id) {
          throw new Error("不能移动到子文件夹中");
        }
        currentFolderId = currentFolder.parentId || "root";
      }
    }

    folder.parentId = newParentId;
    folder.updatedAt = new Date().toISOString();
  }
};
