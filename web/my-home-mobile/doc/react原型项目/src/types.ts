export type FileType = 'folder' | 'image' | 'video' | 'audio' | 'doc' | 'zip' | 'default';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  modifiedAt: string;
  path: string;
  thumbnailUrl?: string;
  childCount?: number;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export type LayoutMode = 'list' | 'grid';

// ── Navigation ──
export type NavTab = 'home' | 'express' | 'cloud' | 'profile';

// ── Smart Home ──
export type DeviceType = 'light' | 'ac' | 'tv' | 'fan' | 'lock' | 'camera' | 'curtain' | 'speaker';

export interface SmartDevice {
  id: string;
  name: string;
  type: DeviceType;
  room: string;
  isOn: boolean;
  value?: string;
}

// ── Express ──
export interface ExpressItem {
  id: string;
  company: string;
  trackingNo: string;
  pickupCode: string;
  deadline: string;
  status: 'pending' | 'arriving' | 'arrived';
  address: string;
  name: string;
}

// ── Profile ──
export interface UserInfo {
  name: string;
  avatar: string;
  phone: string;
  email: string;
  level: string;
}
