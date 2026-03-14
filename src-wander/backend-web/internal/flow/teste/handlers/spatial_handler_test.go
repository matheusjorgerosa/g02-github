package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"backend-web/internal/flow/handlers"
	"backend-web/internal/flow/models"
	"github.com/gin-gonic/gin"
)

func TestHandleSpatialData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		payload        interface{}
		mockSetup      func(*MockFlowRepository)
		expectedStatus int
	}{
		{
			name: "Sucesso - Dados espaciais retornados",
			payload: models.DataRequest{},
			mockSetup: func(m *MockFlowRepository) {
				m.MockGetSpatialData = func(ctx context.Context, filters models.FilterPayload) ([]models.SpatialResponse, error) {
					return []models.SpatialResponse{{Latitude: -23.55, Longitude: -46.63, Volume: 100}}, nil
				}
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "Erro 400 - JSON incorreto",
			payload: "{ bad_json }",
			mockSetup: func(m *MockFlowRepository) {},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Erro 500 - Repositorio falhou",
			payload: models.DataRequest{},
			mockSetup: func(m *MockFlowRepository) {
				m.MockGetSpatialData = func(ctx context.Context, filters models.FilterPayload) ([]models.SpatialResponse, error) {
					return nil, errors.New("internal bq error")
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

			var bodyBytes []byte
			if str, ok := tt.payload.(string); ok {
				bodyBytes = []byte(str)
			} else {
				bodyBytes, _ = json.Marshal(tt.payload)
			}

			req, _ := http.NewRequest(http.MethodPost, "/flow/spatial", bytes.NewBuffer(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			c, _ := gin.CreateTestContext(w)
			c.Request = req

			handler.HandleSpatialData(c)

			if w.Code != tt.expectedStatus {
				t.Errorf("esperado status %d, obtido %d", tt.expectedStatus, w.Code)
			}
		})
	}
}