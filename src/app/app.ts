import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  runInInjectionContext
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ToastContainerComponent } from './components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly startLiveUpdates = import('./services/firebase.service')
    .then(({ FirebaseService }) =>
      runInInjectionContext(this.injector, () => inject(FirebaseService).startRealtime())
    )
    .then(stop => {
      if (this.destroyRef.destroyed) {
        stop();
      } else {
        this.destroyRef.onDestroy(stop);
      }
    })
    .catch(error => console.error('Impossible de démarrer la synchronisation temps réel :', error));
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isAccueil = computed(() => {
    const path = this.currentUrl().split(/[?#]/, 1)[0];
    return path === '/' || path === '';
  });
}