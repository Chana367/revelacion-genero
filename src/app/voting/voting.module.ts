import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { VotingPageRoutingModule } from './voting-routing.module';
import { VotingPage } from './voting.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VotingPageRoutingModule
  ],
  declarations: [VotingPage]
})
export class VotingPageModule {}