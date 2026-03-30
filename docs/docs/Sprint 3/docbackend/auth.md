---
sidebar_position: 2
title: Backend Users
---

## 1. Endpoints - Autenticação e Usuários

O vídeo abaixo mostra o fluxo de login, cadastro, exclusão e atualização de usuários direto no Swagger UI:
<iframe
  width="100%"
  height="420"
  src="https://www.youtube.com/embed/kmgnMXBjCRo"
  title="Swagger - Rotas Login, Register, Delete e Update"
  frameBorder="0"
  allowFullScreen
/>

---

## 2. Rotas públicas

Não exigem autenticação.


### `POST /login`

Autentica o usuário e retorna um token JWT.

**Body:**
```json
{
  "email": "wander@gmail.com",
  "password": "123456"
}
```
_OBS_ acesso acima é de um admin

**Resposta `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respostas de erro:**

| Status | Descrição |
|--------|-----------|
| `401` | Usuário não encontrado ou senha inválida |

---

### `GET /health`

Verifica se a API está no ar.

**Resposta `200`:**
```json
{ "status": "up" }
```

---

## 3. Rotas de admin

Todas exigem `Authorization: Bearer <token>` com role `admin`.

### `GET /admin/users`

Lista todos os usuários ativos. Retorna `id`, `name`, `email` e `role` (a senha nunca é exposta).

**Resposta `200`:**
```json
[
  { "id": 1, "name": "João Silva", "email": "joao@email.com", "role": "user" }
]
```

---

### `POST /admin/users`

Cria um novo usuário com role definido pelo admin.

**Body:**
```json
{
  "name": "Maria Admin",
  "email": "maria@email.com",
  "password": "senha123",
  "role": "admin"
}
```

> `role` aceita apenas `"user"` ou `"admin"`.

---

### `PUT /admin/users/:id`

Atualiza campos de um usuário. Todos os campos são opcionais.

**Body:**
```json
{
  "name": "Novo Nome",
  "email": "novo@email.com",
  "role": "admin",
  "is_active": true
}
```

---

### `DELETE /admin/users/:id`

Remove um usuário (soft delete via GORM + `is_active = false`). A operação roda dentro de uma transação.

**Resposta `200`:**
```json
{ "message": "Usuário deletado com sucesso" }
```

| Status | Descrição |
|--------|-----------|
| `404` | Usuário não encontrado |

---

## 4. Model: User

```go
type User struct {
    ID        uint      `json:"id"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
    IsActive  bool      `json:"is_active"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    Password  string    `json:"-"` // nunca exposto na API
    Role      string    `json:"role"`
}
```

:::info Soft Delete
O campo `DeletedAt` usa `gorm.DeletedAt`. Ao deletar, o GORM preenche esse campo em vez de remover o registro fisicamente. O `ListUsers` retorna apenas registros onde `DeletedAt IS NULL`.
:::