import type { ElectronApi } from '@preload/api/types/api'

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}
