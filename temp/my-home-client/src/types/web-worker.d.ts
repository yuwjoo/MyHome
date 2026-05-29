/**
 * webpack workder模块
 */
export interface WebpackWorkerModule {
  default: {
    new (): Worker;
  };
}
