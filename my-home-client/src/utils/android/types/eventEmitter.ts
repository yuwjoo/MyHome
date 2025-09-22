export interface EventCallback<T extends any[]> {
  (...arg: T): void;
}
