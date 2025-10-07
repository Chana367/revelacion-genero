import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'reveal',
    loadChildren: () => import('./reveal/reveal.module').then( m => m.RevealPageModule)
  },
  {
    path: 'voting',
    loadChildren: () => import('./voting/voting.module').then( m => m.VotingPageModule)
  },
  {
    path: 'all-votes',
    loadChildren: () => import('./all-votes/all-votes.module').then( m => m.AllVotesPageModule)
  }

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
