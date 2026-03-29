package helpers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"os"
	"time"

	flowhandlers "backend-web/internal/flow/handlers"
	"backend-web/internal/platform/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"github.com/golang-jwt/jwt/v5"
)

func NewTestRouter(suite *E2ESuite) *gin.Engine {
	gin.SetMode(gin.TestMode)

	handler := flowhandlers.NewFlowHandler(suite.Repo)

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))

	r.POST("/login", func(c *gin.Context) {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "secret" 
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"email": "qa@venus.com",
			"role":  "admin",
			"exp":   time.Now().Add(time.Hour * 24).Unix(),
		})

		tokenString, err := token.SignedString([]byte(secret))
		if err != nil {
			c.JSON(500, gin.H{"error": "erro ao gerar token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": tokenString})
	})

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "up"}) })

	flow := r.Group("/api/v1/flow")
	flow.Use(middleware.AuthMiddleware())
	{
		flow.POST("/spatial", handler.HandleSpatialData)
		flow.POST("/metrics", handler.HandleMetrics)
		flow.POST("/ranking/neighborhoods", handler.HandleNeighborhoodRanking) 
		flow.POST("/distribution/demographics", handler.HandleDemographics)
	}

	return r
}

func DoRequest(t *testing.T, router *gin.Engine, method, path string, body any, token string) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		require.NoError(t, json.NewEncoder(&buf).Encode(body))
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

func ParseBody(t *testing.T, w *httptest.ResponseRecorder, dst any) {
	t.Helper()
	require.NoError(t, json.NewDecoder(w.Body).Decode(dst), "falha ao decodificar response body")
}

func MustGetValidToken(t *testing.T, router *gin.Engine, email, password string) string {
	t.Helper()
	w := DoRequest(t, router, http.MethodPost, "/login", map[string]string{
		"email":    email,
		"password": password,
	}, "")
	require.Equal(t, http.StatusOK, w.Code, "falha ao obter token de teste")
	var resp struct {
		Token string `json:"token"`
	}
	ParseBody(t, w, &resp)
	return resp.Token
}