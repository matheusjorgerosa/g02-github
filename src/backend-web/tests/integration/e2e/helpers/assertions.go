package helpers

import (
	"testing"

	"backend-web/internal/flow/models"
	"github.com/stretchr/testify/assert"
)

func AssertMetricsConsistency(t *testing.T, m models.MetricsResponse) {
	t.Helper()

	var sum int64
	for _, h := range m.Flow24h {
		assert.GreaterOrEqual(t, h.Hour, 0,
			"hour %d fora do range [0,23]", h.Hour)
		assert.LessOrEqual(t, h.Hour, 23,
			"hour %d fora do range [0,23]", h.Hour)
		assert.Greater(t, h.Volume, int64(0),
			"hora %d não deveria aparecer com volume 0 — BigQuery só retorna horas com COUNT(*) > 0", h.Hour)
		sum += h.Volume
	}

	assert.Equal(t, sum, m.TotalAudience,
		"TotalAudience (%d) deve ser a soma exata dos volumes de Flow24h (%d) — ver metrics_repo.go", m.TotalAudience, sum)
}

func AssertHoursOrdered(t *testing.T, flow []models.HourCount) {
	t.Helper()
	for i := 1; i < len(flow); i++ {
		assert.Greater(t, flow[i].Hour, flow[i-1].Hour,
			"flow24h[%d].Hour (%d) não está em ordem crescente após flow24h[%d].Hour (%d)",
			i, flow[i].Hour, i-1, flow[i-1].Hour)
	}
}

func AssertRankingOrdered(t *testing.T, ranking []models.RankingResponse) {
	t.Helper()
	for i := 1; i < len(ranking); i++ {
		assert.GreaterOrEqual(t, ranking[i-1].Volume, ranking[i].Volume,
			"ranking[%d].Volume (%d) deveria ser >= ranking[%d].Volume (%d)",
			i-1, ranking[i-1].Volume, i, ranking[i].Volume)
	}
}

func AssertPercentageSum(t *testing.T, dist []models.CategoryValue, label string) {
	t.Helper()
	var sum float64
	for _, d := range dist {
		assert.GreaterOrEqual(t, d.Percentage, 0.0,
			"%s: percentagem negativa em category '%s'", label, d.Category)
		assert.GreaterOrEqual(t, d.Volume, int64(0),
			"%s: volume negativo em category '%s'", label, d.Category)
		sum += d.Percentage
	}
	assert.InDelta(t, 100.0, sum, 0.5,
		"%s: soma das percentagens (%.2f%%) deveria ser ~100%%", label, sum)
}
