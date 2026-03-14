package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"backend/internal/models"
	"backend/internal/handlers"
	"github.com/gin-gonic/gin"
)

func TestHandleMetrics(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		payload        interface{}
		mockSetup      func(*MockFlowRepository)
		expectedStatus int
	}{
		{
			name: "Sucesso - Retorna metricas gerais",
			payload: models.DataRequest{},
			mockSetup: func(m *MockFlowRepository) {
				m.MockGetGeneralMetrics = func(ctx context.Context, filters models.FilterPayload) (models.MetricsResponse, error) {
					return models.MetricsResponse{TotalAudience: 1000}, nil
				}
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Erro 400 - Bad Request",
			payload:        `{"filters": "wrong-type"}`,
			mockSetup:      func(m *MockFlowRepository) {},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Erro 500 - Erro de banco de dados",
			payload: models.DataRequest{},
			mockSetup: func(m *MockFlowRepository) {
				m.MockGetGeneralMetrics = func(ctx context.Context, filters models.FilterPayload) (models.MetricsResponse, error) {
					return models.MetricsResponse{}, errors.New("timeout bigquery")
				}
			},
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := &MockFlowRepository{}
			tt.mockSetup(mockRepo)
			handler := handlers.NewFlowHandler(mockRepo)

			bodyBytes, _ := json.Marshal(tt.payload)
			if str, ok := tt.payload.(string); ok { bodyBytes = []byte(str) }

			req, _ := http.NewRequest(http.MethodPost, "/flow/metrics", bytes.NewBuffer(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			handler.HandleMetrics(c)

			if w.Code != tt.expectedStatus {
				t.Errorf("esperado status %d, obtido %d", tt.expectedStatus, w.Code)
			}
		})
	}
}