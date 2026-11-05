import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

const DESTINATION = '/tier-list';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.html',
  styleUrl: './accueil.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccueilComponent {
  private readonly router = inject(Router);

  protected readonly leaving = signal(false);

  protected commencer(): void {
    if (!this.leaving()) {
      this.leaving.set(true);
    }
  }

  protected async terminerTransition(event: AnimationEvent): Promise<void> {
    if (event.target !== event.currentTarget || !this.leaving()) {
      return;
    }

    await this.router.navigateByUrl(DESTINATION);
  }
}
