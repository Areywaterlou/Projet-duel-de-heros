import { Component, input, linkedSignal, output, inject } from '@angular/core';
import { HeroInterface } from '../../data/heroInterface';
import { form, FormField } from '@angular/forms/signals';
import { MessageService } from '../../services/message-service';

@Component({
  selector: 'app-hero-edit-component',
  imports: [FormField],
  templateUrl: './hero-edit-component.html',
  styleUrl: './hero-edit-component.css',
})
export class HeroEditComponent {
  hero = input.required<HeroInterface>();

  heroModel = linkedSignal(() => ({ ...this.hero() }));
  heroForm = form(this.heroModel);

  heroChange = output<HeroInterface>();

  private messageService = inject(MessageService);

  save() {
    const updatedHero = this.heroModel();
    this.messageService.add(`Modification : Héros "${updatedHero.name}" mis à jour avec succès.`);
    this.heroChange.emit(updatedHero);
  }
}