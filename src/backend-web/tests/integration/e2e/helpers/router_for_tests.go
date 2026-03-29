package helpers

import (
	"context"
	"net/http"
	"os"
	"testing"
	"time"

	flowconfig "backend-web/internal/flow/config"
	flowrepo "backend-web/internal/flow/repository"
	"github.com/gin-gonic/gin"
)

type RouterForTest struct {
	Engine *gin.Engine
	token  string
}


func (r *RouterForTest) Token(t *testing.T) string {
	t.Helper()
	if r.token != "" {
		return r.token
	}

	email    := getEnvOrDefault("TEST_USER_EMAIL", "qa@venus.com")
	password := getEnvOrDefault("TEST_USER_PASSWORD", "senha_teste")

	r.token = MustGetValidToken(t, r.Engine, email, password)
	return r.token
}

func getEnvOrDefault(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

func NewE2ESuiteWithRealGeocoder(t *testing.T) *E2ESuite {
	t.Helper()

	if os.Getenv("GOOGLE_APPLICATION_CREDENTIALS") == "" {
		return nil
	}
	if os.Getenv("GOOGLE_MAPS_API_KEY") == "" {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)

	bqClient := flowconfig.ConnectBigQuery(ctx, GCPProject)
	dbEngine  := flowrepo.NewBigQueryAdapter(bqClient)

	geo, err := flowrepo.NewGoogleMapsAdapter()
	if err != nil {
		cancel()
		t.Logf("falha ao inicializar Google Maps adapter: %v", err)
		return nil
	}

	repo := flowrepo.NewFlowRepository(dbEngine, geo)

	return &E2ESuite{
		BQClient: bqClient,
		Repo:     repo,
		Ctx:      ctx,
		Cancel:   cancel,
	}
}

func DoAuthenticatedRequest(t *testing.T, r *RouterForTest, method, path string, body any) *http.Response {
	t.Helper()
	w := DoRequest(t, r.Engine, method, path, body, r.Token(t))
	resp := &http.Response{StatusCode: w.Code}
	return resp
}
