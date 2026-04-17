import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import type { UserRole } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Uso: `*appHasRole="rolesArray"` — muestra la plantilla solo si el rol actual está en la lista.
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  readonly appHasRole = input.required<readonly UserRole[]>();

  constructor() {
    effect(() => {
      const allowed = this.appHasRole();
      const role = this.auth.user()?.role;
      this.vcr.clear();
      if (role && allowed.includes(role)) {
        this.vcr.createEmbeddedView(this.tpl);
      }
    });
  }
}
