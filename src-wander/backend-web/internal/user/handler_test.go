package user

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"backend-web/internal/platform/database"
	"backend-web/internal/platform/logger"
	"backend-web/internal/platform/middleware"
)

// configurações de ambiente
func setupTestEnv() (*gin.Engine, *UserService) {
	gin.SetMode(gin.TestMode)
	logger.Init()

	os.Setenv("JWT_SECRET", "super_secret_test_key_123")

	db, _ := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	database.DB = db
	db.Exec("PRAGMA foreign_keys = OFF")
	db.Migrator().DropTable(&User{})
	db.AutoMigrate(&User{})

	service := &UserService{}
	handler := NewUserHandler(service)

	r := gin.Default()

	r.POST("/login", handler.Login)

	protected := r.Group("/admin")
	protected.Use(middleware.AuthMiddleware(), middleware.AdminOnly())
	{
		protected.POST("/users", handler.CreateUser)
		protected.GET("/users", handler.ListUsers)
		protected.DELETE("/users/:id", handler.DeleteUser)
		protected.PUT("/users/:id", handler.AdminUpdateUser)
	}

	return r, service
}

// cria um token válido na hora do teste 
func generateTestToken(id uint, role string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": id,
		"role":    role,
		"exp":     time.Now().Add(time.Hour).Unix(),
	})
	tokenString, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	return tokenString
}

// Testes

//criação de usuário
func TestCreateUser(t *testing.T) {
	r, service := setupTestEnv()

	adminToken := generateTestToken(1, "admin")
	userToken := generateTestToken(2, "user")

	t.Run("✅ SUCESSO: Deve criar usuário e retornar 201", func(t *testing.T) {
		payload := []byte(`{"name": "Wander", "email": "admin@teste.com", "password": "password123", "role": "admin"}`)
		req, _ := http.NewRequest(http.MethodPost, "/admin/users", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		assert.Contains(t, w.Body.String(), "admin@teste.com")
		assert.NotContains(t, w.Body.String(), "password123") 
	})


	t.Run("❌ ERRO: 409 Conflict - E-mail duplicado", func(t *testing.T) {
		service.CreateUser("Duplicado", "duplo@teste.com", "senha123", "user")

		payload := []byte(`{"name": "Tentativa", "email": "duplo@teste.com", "password": "password123", "role": "user"}`)
		req, _ := http.NewRequest(http.MethodPost, "/admin/users", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusConflict, w.Code)
		assert.Contains(t, w.Body.String(), "Este e-mail já está cadastrado")
	})

	t.Run("❌ ERRO: 400 Bad Request - Falha na validação do binding", func(t *testing.T) {
		payload := []byte(`{"name": "Incompleto"}`) 
		req, _ := http.NewRequest(http.MethodPost, "/admin/users", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Todos os campos obrigatórios")
	})

	t.Run("❌ ERRO: 403 Forbidden - Usuário sem permissão (Não é admin)", func(t *testing.T) {
		payload := []byte(`{"name": "Hacker", "email": "hacker@teste.com", "password": "password123", "role": "admin"}`)
		req, _ := http.NewRequest(http.MethodPost, "/admin/users", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken) 

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusForbidden, w.Code)
		assert.Contains(t, w.Body.String(), "Acesso negado")
	})
}

//login
func TestLogin(t *testing.T) {
	r, service := setupTestEnv()

	service.CreateUser("LoginTest", "logintest@gmail.com", "senhaCerta123", "user")

	t.Run("✅ SUCESSO: Credenciais corretas devem retornar Token (200)", func(t *testing.T) {
		payload := []byte(`{"email": "logintest@gmail.com", "password": "senhaCerta123"}`)
		req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "token") 
	})

	t.Run("❌ ERRO: 401 Unauthorized - Senha Errada", func(t *testing.T) {
		payload := []byte(`{"email": "logintest@gmail.com", "password": "senhaErrada999"}`)
		req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
		assert.Contains(t, w.Body.String(), "senha inválida")
	})

	t.Run("❌ ERRO: 400 Bad Request - Payload de Login Inválido", func(t *testing.T) {
		payload := []byte(`{"email": "nao-e-um-email"}`)
		req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "formato inválido")
	})
}

//get users
func TestListUsers(t *testing.T) {
	r, service := setupTestEnv()
	adminToken := generateTestToken(1, "admin")

	t.Run("✅ SUCESSO: Deve retornar 200 e uma lista de utilizadores", func(t *testing.T) {
		service.CreateUser("List", "list@gmail.com", "senha123", "user")

		req, _ := http.NewRequest(http.MethodGet, "/admin/users", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "list@gmail.com")
	})

	t.Run("❌ ERRO: 401 Unauthorized - Acesso sem Header de Autorização", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/admin/users", nil)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
		assert.Contains(t, w.Body.String(), "Token não fornecido")
	})
}

//deletar usuários
func TestDeleteUser(t *testing.T) {
	r, service := setupTestEnv()
	adminToken := generateTestToken(1, "admin")

	t.Run("✅ SUCESSO: Deve efetuar Soft Delete e retornar 200", func(t *testing.T) {
		user, _ := service.CreateUser("DeleteMe", "delete@gmail.com", "senha123", "user")

		url := fmt.Sprintf("/admin/users/%d", user.ID)
		req, _ := http.NewRequest(http.MethodDelete, url, nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "Usuário deletado com sucesso")
	})

	t.Run("❌ ERRO: 404 Not Found - ID não existente", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodDelete, "/admin/users/9999", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		assert.Contains(t, w.Body.String(), "usuário não encontrado")
	})
}

// atualizar users
func TestAdminUpdateUser(t *testing.T) {
	r, service := setupTestEnv()
	adminToken := generateTestToken(1, "admin")

	t.Run("✅ SUCESSO: Deve atualizar um utilizador e retornar 200", func(t *testing.T) {
		user, _ := service.CreateUser("Original", "original@gmail.com", "senha123", "user")

		url := fmt.Sprintf("/admin/users/%d", user.ID)
		payload := []byte(`{"name": "Atualizado"}`)
		
		req, _ := http.NewRequest(http.MethodPut, url, bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "Usuário atualizado com sucesso")
	})

	t.Run("❌ ERRO: 400 Bad Request - Payload inválido para Update", func(t *testing.T) {
		payload := []byte(`{"email": "email.semarroba"}`)
		
		req, _ := http.NewRequest(http.MethodPut, "/admin/users/1", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}