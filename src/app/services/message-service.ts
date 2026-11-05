import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  messages = signal<string[]>([]);

  add(message: string, autoDismissDelay: number = 4000) {

    this.messages.update(msgs => [...msgs, message]);

    if (autoDismissDelay > 0) {
      setTimeout(() => {
        this.messages.update(msgs => msgs.filter(m => m !== message));
      }, autoDismissDelay);
    }
  }

  clear() {
    this.messages.set([]);
  }
}