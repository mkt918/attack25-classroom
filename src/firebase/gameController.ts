/**
 * ホストの進行ループに「一時停止・スキップ・強制終了」の介入を割り込ませるための
 * 制御オブジェクト。useHostGameLoop はこれの race()/waitIfPaused() を
 * 各待機ポイントに挟むことで、先生のボタン操作を即座に反映できる。
 */
export type RaceResult<T> = { skipped: true } | { skipped: false; value: T };

export class RoomController {
  private paused = false;
  private pausedWaiters: (() => void)[] = [];
  private stopped = false;
  private skipHandlers = new Set<() => void>();

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    const waiters = this.pausedWaiters;
    this.pausedWaiters = [];
    waiters.forEach((w) => w());
  }

  get isPaused(): boolean {
    return this.paused;
  }

  stop(): void {
    this.stopped = true;
    this.triggerSkip();
  }

  get isStopped(): boolean {
    return this.stopped;
  }

  skip(): void {
    this.triggerSkip();
  }

  private triggerSkip(): void {
    this.skipHandlers.forEach((h) => h());
  }

  async waitIfPaused(): Promise<void> {
    if (!this.paused) return;
    await new Promise<void>((resolve) => this.pausedWaiters.push(resolve));
  }

  /** promise を skip/stop シグナルとレースする。先に発火した方で確定する。 */
  race<T>(promise: Promise<T>): Promise<RaceResult<T>> {
    return new Promise((resolve) => {
      let settled = false;
      const handler = () => {
        if (settled) return;
        settled = true;
        this.skipHandlers.delete(handler);
        resolve({ skipped: true });
      };
      this.skipHandlers.add(handler);
      promise.then((value) => {
        if (settled) return;
        settled = true;
        this.skipHandlers.delete(handler);
        resolve({ skipped: false, value });
      });
    });
  }
}
