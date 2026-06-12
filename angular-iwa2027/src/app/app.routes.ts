import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';
import { AdminCreateGroup } from './pages/admin-create-group/admin-create-group';
import { AdminServices } from './pages/admin-services/admin-services';
import { BrowseGroups } from './pages/browse-groups/browse-groups';
import { GroupDetails } from './pages/group-details/group-details';
import { Login } from './auth/login/login';
import { MyApplications } from './pages/my-applications/my-applications';
import { MyGroups } from './pages/my-groups/my-groups';
import { OwnerApplications } from './pages/owner-applications/owner-applications';
import { Profile } from './pages/profile/profile';
import { Register } from './auth/register/register';

export const routes: Routes = [
  { path: '', redirectTo: 'browse', pathMatch: 'full' },
  { path: 'browse', component: BrowseGroups },
  {
    path: 'groups/new',
    component: AdminCreateGroup,
    canActivate: [authGuard],
  },
  { path: 'groups/:id', component: GroupDetails },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'my-groups', component: MyGroups, canActivate: [authGuard] },
  { path: 'my-applications', component: MyApplications, canActivate: [authGuard] },
  {
    path: 'owner-applications',
    component: OwnerApplications,
    canActivate: [authGuard],
  },
  {
    path: 'admin/services',
    component: AdminServices,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
  },
  { path: '**', redirectTo: 'browse' },
];
