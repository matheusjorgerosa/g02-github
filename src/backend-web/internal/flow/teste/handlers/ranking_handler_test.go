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

func TestHandleNeighborhoodRanking(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		payload        interface{}
		mockSetup      func(*MockFlowRepository)
		expectedStatus int
	}{
		{
			name: "Sucesso - Limite informado",
			payload: models.DataRequest{Limit: 5},
			mockSetup: func(m *MockFlowRepository) {
				m.MockGetNeighborhoodRanking = func(ctx context.Context, filters models.FilterPayload, limit int) ([]models.RankingResponse, error) {
					if limit != 5 { t.Errorf("esperado limite 5, obtido %d", limit) }
					return []models.RankingResponse{}, nil
				}
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "Sucesso - Edge Case: Fallback para limite padrao (10)",
			payload: models.DataRequest{Limit: 0}, // Limite zerado deve virar 10
			mockSetup: func(m *MockFlowRepository) {
				m.MockGetNeighborhoodRanking = func(ctx context.Context, filters models.FilterPayload, limit int) ([]models.RankingResponse, error) {
					if limit != 10 { t.Errorf("esperado limite default 10, obtido %d", limit) }
					return []models.RankingResponse{}, nil
				}
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "Erro 500 - Erro no repositorio de ranking",
			payload: models.DataRequest{},
			mockSetup: func(m *MockFlowRepository) {
				m.MockGetNeighborhoodRanking = func(ctx context.Context, filters models.FilterPayload, limit int) ([]models.RankingResponse, error) {
					return nil, errors.New("erro geo")
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
			req, _ := http.NewRequest(http.MethodPost, "/flow/ranking/neighborhoods", bytes.NewBuffer(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			handler.HandleNeighborhoodRanking(c)

			if w.Code != tt.expectedStatus {
				t.Errorf("esperado status %d, obtido %d", tt.expectedStatus, w.Code)
			}
		})
	}
}