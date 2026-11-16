import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'info';

export interface ToastNotification {
  id: number;
  message: string;
  type: NotificationType;
  isLeaving: boolean;
}

const DISPLAY_DURATION_MS = 3200;
const EXIT_DURATION_MS = 280;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationState = signal<ToastNotification[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  readonly notifications = this.notificationState.asReadonly();

  success(message: string): void {
    this.show(message, 'success');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  private show(message: string, type: NotificationType): void {
    const notification: ToastNotification = {
      id: ++this.nextId,
      message,
      type,
      isLeaving: false
    };

    this.notificationState.update(current => [...current, notification]);
    this.timers.set(notification.id, setTimeout(() => {
      this.notificationState.update(current =>
        current.map(item => item.id === notification.id ? { ...item, isLeaving: true } : item)
      );
      this.timers.set(notification.id, setTimeout(() => this.remove(notification.id), EXIT_DURATION_MS));
    }, DISPLAY_DURATION_MS));
  }

  private remove(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.notificationState.update(current => current.filter(item => item.id !== id));
  }
}
