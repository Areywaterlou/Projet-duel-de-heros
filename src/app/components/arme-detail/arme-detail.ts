import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FirebaseService } from '../../services/firebase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-arme-detail-page',
  imports: [RouterLink],
  templateUrl: './arme-detail.html',
  styleUrl: './arme-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArmeDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly firebaseService = inject(FirebaseService);
  private readonly notifications = inject(NotificationService);

  private readonly armeId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') }
  );

  protected readonly armes = this.firebaseService.armesEnDirect;
  protected readonly herosSource = this.firebaseService.herosEnDirect;
  protected readonly erreurArmes = this.firebaseService.erreurArmesEnDirect;
  protected readonly erreurHeros = this.firebaseService.erreurHerosEnDirect;
  protected readonly arme = computed(() =>
    this.armes()?.find(item => item.id === this.armeId()) ?? null
  );
  protected readonly heros = computed(() =>
    (this.herosSource() ?? []).filter(hero => hero.armeId === this.armeId())
  );
  protected readonly chargementArme = computed(() => this.armes() === undefined);
  protected readonly chargementHeros = computed(() => this.herosSource() === undefined);
  protected readonly suppression = signal(false);
  protected readonly erreur = signal('');
  protected readonly peutSupprimer = computed(() =>
    !this.chargementHeros() && !this.erreurHeros() && this.heros().length === 0
  );

  protected async supprimer(): Promise<void> {
    const arme = this.arme();
    if (!arme || !this.peutSupprimer() || !window.confirm(`Supprimer définitivement ${arme.nom} ?`)) {
      return;
    }

    this.erreur.set('');
    this.suppression.set(true);
    try {
      await this.firebaseService.supprimerArme(arme.id);
      this.notifications.success(`Arme ${arme.nom} supprimée`);
      await this.router.navigateByUrl('/armes');
    } catch (error) {
      console.error('Erreur lors de la suppression de l’arme :', error);
      this.erreur.set(error instanceof Error ? error.message : 'La suppression de l’arme a échoué.');
    } finally {
      this.suppression.set(false);
    }
  }
}
