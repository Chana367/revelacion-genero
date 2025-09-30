import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RevealPageRoutingModule } from './reveal-routing.module';

import { RevealPage } from './reveal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RevealPageRoutingModule
  ],
  declarations: [RevealPage]
})
export class RevealPageModule {}
