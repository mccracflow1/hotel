# Quickstart — Portal Angular Semana 6

## Prerrequisitos

- Node.js **20+**
- Backend en `backend/` con `DATABASE_URL`, migraciones aplicadas, `.env` con `JWT_SECRET` (64+ chars) y usuarios de prueba por rol.
- API escuchando (ej. `http://localhost:3000`).

## 1. Levantar el API

```powershell
Set-Location backend
npm install
npm run migrate
npm run dev
```

Verificar `http://localhost:3000/api/v1/health`.

## 2. Crear y levantar `admin-portal/` (tras implementar T001–T020 del tasks.md)

```powershell
Set-Location e:\Proyectos\multi_stage\hotel
cd admin-portal
npm install
npm start
```

Configurar `src/environments/environment.development.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
};
```

## 3. Flujo de verificación manual (MVP Semana 6)

1. Login con usuario **ADMIN** → debe llegar a dashboard.
2. Abrir **Habitaciones** → listar; crear borrador de habitación de prueba; subir imagen si el API de medios está activo.
3. Abrir **Disponibilidad** → cambiar mes; abrir día; intentar bloqueo (ADMIN).
4. Repetir con **VIEWER** → no debe ver menú habitaciones ni acciones de escritura en disponibilidad.

## 4. CORS y cookies

Si el portal corre en `localhost:4200` y el API en `3000`, el backend debe permitir origen y credenciales (`credentials: true` en CORS) para que **refresh** funcione.

## Referencias

- [spec.md](../spec.md)
- [contracts/README.md](./contracts/README.md)
- `CONTEXTO_MAESTRO.md` §20 variables de entorno
