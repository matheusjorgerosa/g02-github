package ranking

import (
	"fmt"
	"net/http"
	"testing"
	"backend-web/internal/flow/models"
	"backend-web/tests/integration/e2e/helpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupSuite(t *testing.T) (*helpers.E2ESuite, *helpers.RouterForTest) {
	t.Helper()
	s := helpers.NewE2ESuite(t)
	t.Cleanup(s.Close)
	return s, &helpers.RouterForTest{Engine: helpers.NewTestRouter(s)}
}


func TestRanking_LimitRespected_OrderedByVolumeDesc(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 5)

	body := models.DataRequest{Filters: &filters, Limit: 5}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/ranking/neighborhoods", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code, "response: %s", w.Body.String())

	var resp struct {
		Ranking []models.RankingResponse `json:"ranking"`
	}
	helpers.ParseBody(t, w, &resp)

	assert.Len(t, resp.Ranking, 5,
		"limit=5 deveria retornar exatamente 5 itens (LIMIT 5 na query do BigQuery)")

	for i, item := range resp.Ranking {
		assert.NotEmpty(t, item.Name,
			"ranking[%d]: name não deveria ser vazio", i)
		assert.Greater(t, item.Volume, int64(0),
			"ranking[%d]: volume deveria ser > 0", i)
	}


	helpers.AssertRankingOrdered(t, resp.Ranking)
}


func TestRanking_LimitZero_DefaultsTo10(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 10)

	body := models.DataRequest{Filters: &filters, Limit: 0}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/ranking/neighborhoods", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Ranking []models.RankingResponse `json:"ranking"`
	}
	helpers.ParseBody(t, w, &resp)

	assert.LessOrEqual(t, len(resp.Ranking), 10,
		"limit=0 → default 10 — não deveria retornar mais de 10 itens")
}

func TestRanking_NoLimit_DefaultsTo10(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 1)

	body := map[string]any{
		"filters": filters,
	}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/ranking/neighborhoods", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Ranking []models.RankingResponse `json:"ranking"`
	}
	helpers.ParseBody(t, w, &resp)

	assert.LessOrEqual(t, len(resp.Ranking), 10,
		"sem campo limit → zero value → default 10")
}

func TestRanking_GeocoderFallback_ReturnsCoordinateString(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters, Limit: 3}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/ranking/neighborhoods", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code,
		"RISCO 4: erro do geocoder descartado com _ — não deveria causar 500")

	var resp struct {
		Ranking []models.RankingResponse `json:"ranking"`
	}
	helpers.ParseBody(t, w, &resp)

	for i, item := range resp.Ranking {

		assert.NotEmpty(t, item.Name, "ranking[%d]: name não deveria ser vazio mesmo com geocoder falho", i)
		assert.NotEqual(t, "Rua não encontrada", item.Name,
			"ranking[%d]: NullGeoCoder deveria retornar '%.4f,%.4f' e não 'Rua não encontrada'", i)
	}
}

func TestRanking_RealGeocoder_ReturnsStreetName(t *testing.T) {
	
	s := helpers.NewE2ESuiteWithRealGeocoder(t)
	if s == nil {
		t.Skip("GOOGLE_MAPS_API_KEY não configurada — pulando teste de geocodificação real")
	}
	t.Cleanup(s.Close)
	r := &helpers.RouterForTest{Engine: helpers.NewTestRouter(s)}

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters, Limit: 1}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/ranking/neighborhoods", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Ranking []models.RankingResponse `json:"ranking"`
	}
	helpers.ParseBody(t, w, &resp)

	require.NotEmpty(t, resp.Ranking)
	firstName := resp.Ranking[0].Name

	assert.NotEqual(t, "Rua não encontrada", firstName,
		"geocodificação real deveria retornar nome de rua válido para coordenadas de SP")

	assert.Regexp(t, "[a-zA-Z]", firstName, "O nome da rua deve conter letras (indica geocodificação real)")

	t.Logf("Rua mais movimentada geocodificada: %s (volume: %d)", firstName, resp.Ranking[0].Volume)

}

func TestRanking_EmptyFilters_ReturnsEmptyRanking(t *testing.T) {
	_, r := setupSuite(t)

	f := helpers.EmptyFilter()
	body := models.DataRequest{Filters: &f}

	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/ranking/neighborhoods", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Ranking []models.RankingResponse `json:"ranking"`
	}
	helpers.ParseBody(t, w, &resp)

	assert.Empty(t, resp.Ranking,
		"RISCO 1: filtros vazios → UNNEST([]) → vazio → ranking nil/vazio")
}

func TestRanking_AgeRangePlus_Expands(t *testing.T) {
	s, r := setupSuite(t)

	filters := models.FilterPayload{
		AgeGroups:     []string{"80+"},
		Genders:       []string{"M", "F"},
		SocialClasses: []string{"A", "B1", "C"},
	}
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters, Limit: 5}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/ranking/neighborhoods", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Ranking []models.RankingResponse `json:"ranking"`
	}
	helpers.ParseBody(t, w, &resp)

	assert.NotEmpty(t, resp.Ranking,
		"'80+' expande para [80..99] — deveria retornar resultados se SkipIfNoData passou")

	t.Logf("Ranking para '80+': %d ruas encontradas", len(resp.Ranking))
	for i, item := range resp.Ranking {
		t.Logf("  [%d] %s — volume: %d", i+1, item.Name, item.Volume)
	}
}

func TestRanking_ResponseEnvelope(t *testing.T) {
	s, r := setupSuite(t)
	s.SkipIfNoData(t, helpers.ValidSPFilter(), 1)

	f := helpers.ValidSPFilter()
	body := models.DataRequest{Filters: &f, Limit: 1}

	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/ranking/neighborhoods", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var raw map[string]interface{}
	helpers.ParseBody(t, w, &raw)

	_, hasRanking := raw["ranking"]
	assert.True(t, hasRanking,
		"resposta deve ter envelope 'ranking' — ver ranking_handler.go: gin.H{\"ranking\": ranking}")

	_, hasData := raw["data"]
	assert.False(t, hasData,
		"ranking não usa envelope 'data' — apenas spatial usa 'data'")

		for key := range raw {
		assert.Equal(t, "ranking", key,
			fmt.Sprintf("campo inesperado '%s' na resposta do ranking", key))
	}
}
