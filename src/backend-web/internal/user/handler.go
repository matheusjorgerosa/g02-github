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
		if strings.Contains(err.Error(), "duplicate key") {
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
// @Tags         Auth
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