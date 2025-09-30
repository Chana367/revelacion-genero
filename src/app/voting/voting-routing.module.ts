import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VotingPage } from './voting.page';

const routes: Routes = [
  {
    path: '',
    component: VotingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VotingPageRoutingModule {}