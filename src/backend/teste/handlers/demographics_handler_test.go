package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"context"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
	"backend/internal/handlers"
)

func TestHandleDemographics(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		payload        interface{}
		mockSetup      func(*MockFlowRepository)
		expectedStatus int
	}{
		{
			name: "Sucesso - Retorna demografia corretamente",
			payload: models.DataRequest{
				Filters: models.FilterPayload{AgeGroups: []string{"18-24"}},
			},
			mockSetup: func(m *MockFlowRepository) {
				m.MockGetDemographics = func(ctx context.Context, filters models.FilterPayload) (models.DemographicsResponse, error) {
					return models.DemographicsResponse{}, nil
				}
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Erro 400 - Payload invalido",
			payload:        "invalid-json",
			mockSetup:      func(m *MockFlowRepository) {},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Erro 500 - Falha no repositorio",
			payload: models.DataRequest{},
			mockSetup: func(m *MockFlowRepository) {
				m.MockGetDemographics = func(ctx context.Context, filters models.FilterPayload) (models.DemographicsResponse, error) {
					return models.DemographicsResponse{}, errors.New("erro no banco")
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

			req, _ := http.NewRequest(http.MethodPost, "/flow/distribution/demographics", bytes.NewBuffer(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			c, _ := gin.CreateTestContext(w)
			c.Request = req

			handler.HandleDemographics(c)

			if w.Code != tt.expectedStatus {
				t.Errorf("esperado status %d, obtido %d", tt.expectedStatus, w.Code)
			}
		})
	}
}