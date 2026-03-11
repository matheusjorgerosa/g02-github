package user

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"backend-web/internal/platform/logger"
	"go.uber.org/zap"
	"strings"
)

type UserHandler struct {
	service *UserService
}

func NewUserHandler(s *UserService) *UserHandler {
	return &UserHandler{service: s}
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Dados inválidos para criação de usuário", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verifique os dados enviados"})
		return
	}

	// Chama o Service 
	user, err := h.service.CreateUser(req.Name, req.Email, req.Password, req.Role)
	if err != nil {
    // Se o erro contém "duplicate key", o erro é do cliente (409 Conflict ou 400 Bad Request)
    if strings.Contains(err.Error(), "duplicate key") {
        c.JSON(http.StatusConflict, gin.H{"error": "Este e-mail já está cadastrado"})
        return
    }
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar usuário"})
    return
}
	// Retorna
	c.JSON(http.StatusCreated, user)
}

