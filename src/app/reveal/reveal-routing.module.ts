import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RevealPage } from './reveal.page';

const routes: Routes = [
  {
    path: '',
    component: RevealPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RevealPageRoutingModule {}
