package helpers

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"
	"strings"
	"cloud.google.com/go/bigquery"
	"strconv"
	flowconfig "backend-web/internal/flow/config"
	"backend-web/internal/flow/models"
	flowrepo "backend-web/internal/flow/repository"
	"github.com/stretchr/testify/require"
)

const (
	GCPProject = "venus-m09"
	BQDataset  = "trusted"
	BQTable    = "ingestao"

	SPLatMin = -34.0 
	SPLatMax = -5.0  
	SPLngMin = -75.0 
	SPLngMax = -34.0 
)

type E2ESuite struct {
	BQClient *bigquery.Client
	Repo     *flowrepo.FlowRepository
	Ctx      context.Context
	Cancel   context.CancelFunc
}

func NewE2ESuite(t *testing.T) *E2ESuite {
	t.Helper()

	if os.Getenv("GOOGLE_APPLICATION_CREDENTIALS") == "" {
		t.Skip("GOOGLE_APPLICATION_CREDENTIALS não configurada — pulando testes E2E de BigQuery")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)

	bqClient := flowconfig.ConnectBigQuery(ctx, GCPProject)
	dbEngine := flowrepo.NewBigQueryAdapter(bqClient)

	geo := &NullGeoCoder{}

	repo := flowrepo.NewFlowRepository(dbEngine, geo)

	return &E2ESuite{
		BQClient: bqClient,
		Repo:     repo,
		Ctx:      ctx,
		Cancel:   cancel,
	}
}

func (s *E2ESuite) Close() {
	s.Cancel()
	s.BQClient.Close()
}

func (s *E2ESuite) HasData(t *testing.T, filters models.FilterPayload, minRows int) bool {
	t.Helper()

	ctx, cancel := context.WithTimeout(s.Ctx, 30*time.Second)
	defer cancel()

	q := s.BQClient.Query(fmt.Sprintf(
		"SELECT COUNT(*) as cnt FROM `%s.%s.%s` "+
			"WHERE CAST(idade AS STRING) IN UNNEST(@ages) "+
			"AND genero IN UNNEST(@genders) "+
			"AND classe_social IN UNNEST(@classes) "+
			"LIMIT 1",
		GCPProject, BQDataset, BQTable,
	))
	q.Parameters = []bigquery.QueryParameter{
		{Name: "ages",    Value: expandAgesForCheck(filters.AgeGroups)},
		{Name: "genders", Value: filters.Genders},
		{Name: "classes", Value: filters.SocialClasses},
	}

	it, err := q.Read(ctx)
	require.NoError(t, err, "falha ao verificar existência de dados no BigQuery")

	var row struct {
		Cnt int64 `bigquery:"cnt"`
	}
	require.NoError(t, it.Next(&row))
	return int(row.Cnt) >= minRows
}

func (s *E2ESuite) SkipIfNoData(t *testing.T, filters models.FilterPayload, minRows int) {
	t.Helper()
	if !s.HasData(t, filters, minRows) {
		t.Skipf("dataset BigQuery sem dados suficientes para filtro %+v — pulando", filters)
	}
}

// expandAgesForCheck replica EXATAMENTE a lógica de expandAgeRanges do bq_adapter.go
func expandAgesForCheck(ranges []string) []string {
	var ages []string
	for _, r := range ranges {
		if strings.HasSuffix(r, "+") {
			// Lógica para "80+"
			base, err := strconv.Atoi(strings.TrimSuffix(r, "+"))
			if err != nil {
				continue
			}
			for i := base; i <= 99; i++ {
				ages = append(ages, fmt.Sprintf("%d", i))
			}
		} else if parts := strings.SplitN(r, "-", 2); len(parts) == 2 {
			// Lógica para "18-24"
			lo, err1 := strconv.Atoi(parts[0])
			hi, err2 := strconv.Atoi(parts[1])
			if err1 != nil || err2 != nil {
				continue
			}
			for i := lo; i <= hi; i++ {
				ages = append(ages, fmt.Sprintf("%d", i))
			}
		} else {
			// Caso base: "25"
			ages = append(ages, r)
		}
	}
	return ages
}
type NullGeoCoder struct{}

func (n *NullGeoCoder) ReverseGeocode(_ context.Context, lat, lng float64) (string, error) {
	return fmt.Sprintf("%.4f,%.4f", lat, lng), nil
}

func ValidSPFilter() models.FilterPayload {
	return models.FilterPayload{
		AgeGroups:     []string{"18-24", "25-34"},
		Genders:       []string{"M", "F"},
		SocialClasses: []string{"A", "B", "C"},
	}
}

func EmptyFilter() models.FilterPayload {
	return models.FilterPayload{
		AgeGroups:     []string{},
		Genders:       []string{},
		SocialClasses: []string{},
	}
}
