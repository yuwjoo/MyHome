import folderIcon from "@/assets/imgs/cloudDrive/folder.png";
import apkFileIcon from "@/assets/imgs/cloudDrive/apkFile.png";
import audioFileIcon from "@/assets/imgs/cloudDrive/audioFile.png";
import codeFileIcon from "@/assets/imgs/cloudDrive/codeFile.png";
import excelFileIcon from "@/assets/imgs/cloudDrive/excelFile.png";
import exeFileIcon from "@/assets/imgs/cloudDrive/exeFile.png";
import imageFileIcon from "@/assets/imgs/cloudDrive/imageFile.png";
import jsFileIcon from "@/assets/imgs/cloudDrive/jsFile.png";
import pdfFileIcon from "@/assets/imgs/cloudDrive/pdfFile.png";
import pptFileIcon from "@/assets/imgs/cloudDrive/pptFile.png";
import textFileIcon from "@/assets/imgs/cloudDrive/textFile.png";
import unknownFileIcon from "@/assets/imgs/cloudDrive/unknownFile.png";
import videoFileIcon from "@/assets/imgs/cloudDrive/videoFile.png";
import wordFileIcon from "@/assets/imgs/cloudDrive/wordFile.png";
import zipFileIcon from "@/assets/imgs/cloudDrive/zipFile.png";

/**
 * 获取文件夹图标
 * @return 文件夹图标地址
 */
export const getFolderIcon = () => {
  return folderIcon;
};

/**
 * 获取文件图标
 * @param {string} extension 文件后缀
 * @return 文件图标地址
 */
export const getFileIcon = (extension: string): string => {
  const iconMap: Record<string, string> = {
    // 文档类型
    doc: wordFileIcon,
    docx: wordFileIcon,
    pdf: pdfFileIcon,
    txt: textFileIcon,
    // 表格类型
    xls: excelFileIcon,
    xlsx: excelFileIcon,
    // 演示文档
    ppt: pptFileIcon,
    pptx: pptFileIcon,
    // 图片类型
    jpg: imageFileIcon,
    jpeg: imageFileIcon,
    png: imageFileIcon,
    gif: imageFileIcon,
    // 音频类型
    mp3: audioFileIcon,
    wav: audioFileIcon,
    // 视频类型
    mp4: videoFileIcon,
    avi: videoFileIcon,
    // 压缩文件
    zip: zipFileIcon,
    rar: zipFileIcon,
    // 代码文件
    js: jsFileIcon,
    ts: codeFileIcon,
    html: codeFileIcon,
    css: codeFileIcon,
    // 可执行文件
    exe: exeFileIcon,
    apk: apkFileIcon
  };

  return iconMap[extension.toLowerCase()] || unknownFileIcon;
};
