import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { HERO_STATS, HERO_WEAPONS, WEAPON_RARITIES, WEAPON_RULES } from '../../data/game-constants';
import type { HeroStat } from '../../data/hero';
import type { Arme, ArmeFormValue, WeaponRarity } from '../../data/weapon';
import { weaponFormSchemaForRarity } from '../../data/weapon-rules';
import { FirebaseService } from '../../services/firebase.service';
import { NotificationService } from '../../services/notification.service';

const EMPTY_WEAPON: ArmeFormValue = {
  nom: '',
  type: '',
  rarete: 5,
  statPrincipale: 'attaque',
  bonusPrincipal: 9,
  statSecondaire: 'defense',
  bonusSecondaire: 4
};

function weaponFormValue(weapon: Arme): ArmeFormValue {
  return {
    nom: weapon.nom,
    type: weapon.type,
    rarete: weapon.rarete,
    statPrincipale: weapon.statPrincipale,
    bonusPrincipal: weapon.bonusPrincipal,
    statSecondaire: weapon.statSecondaire,
    bonusSecondaire: weapon.bonusSecondaire
  };
}

@Component({
  selector: 'app-arme-form',
  imports: [FormField, RouterLink],
  templateUrl: './arme-form.html',
  styleUrl: './arme-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArmeFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly firebaseService = inject(FirebaseService);
  private readonly notifications = inject(NotificationService);
  private readonly armeId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') }
  );

  protected readonly types = HERO_WEAPONS;
  protected readonly stats = HERO_STATS;
  protected readonly raretes = WEAPON_RARITIES;
  protected readonly statLabels: Record<HeroStat, string> = {
    attaque: 'Attaque',
    defense: 'Défense',
    pv: 'Points de vie',
    soin: 'Soin',
    esquive: 'Esquive'
  };
  protected readonly armes = this.firebaseService.armesEnDirect;
  protected readonly erreurArmes = this.firebaseService.erreurArmesEnDirect;
  protected readonly arme = computed(() => {
    const id = this.armeId();
    return id ? this.armes()?.find(item => item.id === id) ?? null : null;
  });
  protected readonly chargementArme = computed(() => !!this.armeId() && this.armes() === undefined);
  protected readonly model = signal<ArmeFormValue>({ ...EMPTY_WEAPON });
  protected readonly formulaire = form(
    this.model,
    weaponFormSchemaForRarity(() => this.model().rarete)
  );
  private lastModelWeaponId: string | null = null;
  private readonly synchronizeForm = effect(() => {
    const weapon = this.arme();
    if (!weapon) return;
    const next = weaponFormValue(weapon);
    if (this.lastModelWeaponId !== weapon.id) {
      this.lastModelWeaponId = weapon.id;
      this.model.set(next);
    } else if (!this.formulaire().dirty() && JSON.stringify(this.model()) !== JSON.stringify(next)) {
      this.model.set(next);
    }
  });
  protected readonly bounds = computed(() => WEAPON_RULES.bonusesByRarity[this.model().rarete]);
  protected readonly enregistrement = signal(false);
  protected readonly erreur = signal('');

  protected changerBonus(principal: boolean, delta: number): void {
    this.model.update(weapon => {
      const bounds = WEAPON_RULES.bonusesByRarity[weapon.rarete][principal ? 'primary' : 'secondary'];
      const key = principal ? 'bonusPrincipal' : 'bonusSecondaire';
      return { ...weapon, [key]: Math.min(bounds.max, Math.max(bounds.min, weapon[key] + delta)) };
    });
  }

  protected changerStat(principal: boolean, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (!HERO_STATS.some(stat => stat === value)) return;
    this.model.update(weapon => principal
      ? { ...weapon, statPrincipale: value as HeroStat }
      : { ...weapon, statSecondaire: value as HeroStat });
  }

  protected changerRarete(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!WEAPON_RARITIES.some(rarity => rarity === value)) return;
    const bounds = WEAPON_RULES.bonusesByRarity[value as WeaponRarity];
    this.model.update(weapon => ({
      ...weapon,
      rarete: value as WeaponRarity,
      bonusPrincipal: bounds.primary.min,
      bonusSecondaire: bounds.secondary.min
    }));
  }

  protected async soumettre(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.erreur.set('');
    this.formulaire().markAsTouched();
    if (!this.formulaire().valid()) return;
    this.enregistrement.set(true);
    try {
      const currentId = this.armeId();
      if (currentId) {
        await this.firebaseService.modifierArme(currentId, this.model());
        this.notifications.success(`Arme ${this.model().nom.trim()} mise à jour`);
        await this.router.navigate(['/armes', currentId]);
      } else {
        const id = await this.firebaseService.ajouterArme(this.model());
        this.notifications.success(`Arme ${this.model().nom.trim()} ajoutée avec succès`);
        await this.router.navigate(['/armes', id]);
      }
    } catch (error) {
      console.error('Erreur lors de l’enregistrement de l’arme :', error);
      this.erreur.set(error instanceof Error ? error.message : 'L’enregistrement de l’arme a échoué.');
    } finally {
      this.enregistrement.set(false);
    }
  }
}
