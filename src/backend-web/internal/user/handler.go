package user

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"backend-web/internal/platform/logger"
	"strings"
)

type UserHandler struct {
	service *UserService
}

func NewUserHandler(s *UserService) *UserHandler {
	return &UserHandler{service: s}
}

// CreateUser godoc
// @Summary      Criar um novo usuário
// @Description  Cria um usuário no sistema. Requer token de administrador.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body      CreateUserRequest  true  "Dados do novo usuário"
// @Success      201      {object}  User
// @Failure      403      {object}  map[string]string
// @Router       /admin/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": translateValidationError(err)})
		return
	}

	user, err := h.service.CreateUser(req.Name, req.Email, req.Password, req.Role)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "UNIQUE constraint failed") {
			c.JSON(http.StatusConflict, gin.H{"error": "Este e-mail já está cadastrado"})
			return
		}
		logger.Error("Erro ao criar usuário", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro interno ao processar cadastro"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// Signup godoc
// @Summary      Cadastro público de usuário
// @Description  Cria um novo usuário com role "user" fixo
// @Tags         Public
// @Accept       json
// @Produce      json
// @Param        request  body      SignupRequest  true  "Dados do novo usuário"
// @Success      201      {object}  User
// @Failure      400      {object}  map[string]string
// @Failure      409      {object}  map[string]string
// @Router       /signup [post]
func (h *UserHandler) Signup(c *gin.Context) {
	var req SignupRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": translateValidationError(err)})
		return
	}

	user, err := h.service.CreateUser(req.Name, req.Email, req.Password, "user")
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "UNIQUE constraint failed") {
			c.JSON(http.StatusConflict, gin.H{"error": "Este e-mail já está cadastrado"})
			return
		}
		logger.Error("Erro ao criar usuário", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro interno ao processar cadastro"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// Login godoc
// @Summary      Realizar login
// @Description  Autentica o usuário e retorna um token JWT
// @Tags         Public
// @Accept       json
// @Produce      json
// @Param        request  body      LoginRequest  true  "Credenciais de login"
// @Success      200      {object}  LoginResponse
// @Failure      401      {object}  map[string]string
// @Router       /login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email ou senha em formato inválido"})
		return
	}

	token, err := h.service.Login(req.Email, req.Password) // Note: Chame o método do service aqui
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{Token: token})
}

// DeleteUser godoc
// @Summary      Deletar um usuário
// @Description  Remove um usuário do sistema (Soft Delete). Requer privilégios de administrador.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "ID do Usuário"
// @Success      200  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Router       /admin/users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")

	if err := h.service.DeleteUser(id); err != nil {
		if err.Error() == "usuário não encontrado" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar usuário"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário deletado com sucesso"})
}

// ListUsers godoc
// @Summary      Listar todos os usuários
// @Description  Retorna uma lista de todos os usuários ativos no sistema. Requer privilégios de administrador.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   User
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Router       /admin/users [get]
func (h *UserHandler) ListUsers(c *gin.Context) {
    users, err := h.service.ListUsers()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao recuperar lista de usuários"})
        return
    }

    c.JSON(http.StatusOK, users)
}

// AdminUpdateUser godoc
// @Summary      Atualizar qualquer usuário (Admin)
// @Description  Permite alterar nome, e-mail ou cargo de um usuário via ID.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id       path      int                    true  "ID do Usuário"
// @Param        request  body      AdminUpdateUserRequest true  "Campos a atualizar"
// @Success      200      {object}  map[string]string
// @Router       /admin/users/{id} [put]
func (h *UserHandler) AdminUpdateUser(c *gin.Context) {
	id := c.Param("id")
	var req AdminUpdateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos ou cargo inexistente"})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" { updates["name"] = req.Name }
	if req.Email != "" { updates["email"] = req.Email }
	if req.Role != "" { updates["role"] = req.Role }
	if req.IsActive != nil { updates["is_active"] = *req.IsActive }

	if err := h.service.AdminUpdateUser(id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário atualizado com sucesso"})
}


//handler para formatação de erros
func translateValidationError(err error) string {
	errStr := err.Error()

	if strings.Contains(errStr, "'Email' failed on the 'email'") {
		return "O formato do e-mail é inválido."
	}
	if strings.Contains(errStr, "'Password' failed on the 'min'") {
		return "A senha deve ter no mínimo 6 caracteres."
	}
	if strings.Contains(errStr, "failed on the 'required'") {
		return "Todos os campos obrigatórios devem ser preenchidos."
	}
	if strings.Contains(errStr, "'Role' failed on the 'oneof'") {
		return "O cargo (role) deve ser 'admin' ou 'user'."
	}

	return "Dados enviados estão incorretos. Verifique os campos."
}