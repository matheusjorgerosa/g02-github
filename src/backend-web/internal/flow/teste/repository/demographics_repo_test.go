package repository

import (
	"context"
	"errors"
	"strings"
	"testing"
	"google.golang.org/api/iterator"
	"backend-web/internal/flow/models"
	"backend-web/internal/flow/repository"
)

type DemographicsIterator struct {
	Rows  []models.CategoryValue
	index int
}
func (m *DemographicsIterator) Next(dst interface{}) error {
	if m.index >= len(m.Rows) { return iterator.Done }
	row := dst.(*models.CategoryValue)
	*row = m.Rows[m.index]
	m.index++
	return nil
}

func TestGetDemographics(t *testing.T) {
	tests := []struct {
		name        string
		mockDBSetup func() repository.DBEngine
		expectError bool
	}{
		{
			name: "Sucesso - Retorna distribuição de gênero e classe",
			mockDBSetup: func() repository.DBEngine {
				return &MockDBEngine{
					MockQuery: func(ctx context.Context, sql string, filters models.FilterPayload) (repository.RowIterator, error) {
						
						if strings.Contains(sql, "genero as category") {
							return &DemographicsIterator{
								Rows: []models.CategoryValue{{Category: "Feminino", Volume: 50, Percentage: 100.0}},
							}, nil
						}
						return &DemographicsIterator{
							Rows: []models.CategoryValue{{Category: "Classe C", Volume: 50, Percentage: 100.0}},
						}, nil
					},
				}
			},
			expectError: false,
		},
		{
			name: "Erro - Falha na query do banco",
			mockDBSetup: func() repository.DBEngine {
				return &MockDBEngine{
					MockQuery: func(ctx context.Context, sql string, filters models.FilterPayload) (repository.RowIterator, error) {
						return nil, errors.New("db error")
					},
				}
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := repository.NewFlowRepository(tt.mockDBSetup(), &MockGeoCoder{})
			res, err := repo.GetDemographics(context.Background(), models.FilterPayload{})

			if tt.expectError && err == nil { t.Errorf("Esperava erro, não ocorreu") }
			if !tt.expectError && err != nil { t.Errorf("Não esperava erro: %v", err) }
			
			if !tt.expectError {
				if len(res.Gender) == 0 || res.Gender[0].Category != "Feminino" {
					t.Errorf("Distribuição de gênero falhou")
				}
				if len(res.SocialClass) == 0 || res.SocialClass[0].Category != "Classe C" {
					t.Errorf("Distribuição de classe social falhou")
				}
			}
		})
	}
}