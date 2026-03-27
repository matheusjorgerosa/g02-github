package metrics

import (
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

func TestMetrics_TotalAudienceConsistency(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/metrics", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code, "response: %s", w.Body.String())

	var resp models.MetricsResponse
	helpers.ParseBody(t, w, &resp)

	assert.GreaterOrEqual(t, resp.TotalAudience, int64(0))

	helpers.AssertMetricsConsistency(t, resp)
}

func TestMetrics_Flow24h_OrderedByHourASC(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/metrics", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp models.MetricsResponse
	helpers.ParseBody(t, w, &resp)

	require.NotEmpty(t, resp.Flow24h, "deveria haver pelo menos 1 hora com dados")
	helpers.AssertHoursOrdered(t, resp.Flow24h)
}

func TestMetrics_Flow24h_NoGaps_MaxOf24Items(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/metrics", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp models.MetricsResponse
	helpers.ParseBody(t, w, &resp)

	assert.LessOrEqual(t, len(resp.Flow24h), 24,
		"Flow24h não pode ter mais de 24 itens (24 horas no dia)")

	for _, h := range resp.Flow24h {
		assert.Greater(t, h.Volume, int64(0),
			"hora %d não deveria aparecer com volume 0 — "+
				"BigQuery só retorna horas onde COUNT(*) > 0 (GROUP BY sem GENERATE_ARRAY)", h.Hour)
	}
}

func TestMetrics_EmptyFilters_ReturnsZeroAndNullFlow(t *testing.T) {
	_, r := setupSuite(t)

	f := helpers.EmptyFilter()
	body := models.DataRequest{Filters: &f}
	
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/metrics", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code,
		"arrays vazios com campo 'filters' presente não deveria retornar 400")

	var raw map[string]interface{}
	helpers.ParseBody(t, w, &raw)

	totalAudience, _ := raw["totalAudience"].(float64)
	assert.Equal(t, float64(0), totalAudience,
		"RISCO 1: arrays vazios → UNNEST([]) → WHERE false → nenhuma linha → TotalAudience=0")

	flow24h := raw["flow24h"]
	assert.Nil(t, flow24h,
		"RISCO 1 + Go nil-slice: Flow24h deveria ser null no JSON (var flow []HourCount → nil → null)")
}

func TestMetrics_SingleGenderFilter(t *testing.T) {
	s, r := setupSuite(t)

	filterMasc := models.FilterPayload{
		AgeGroups:     []string{"18-65"},
		Genders:       []string{"M"},
		SocialClasses: []string{"A", "B", "C", "D", "E"},
	}
	filterFem := models.FilterPayload{
		AgeGroups:     []string{"18-65"},
		Genders:       []string{"F"},
		SocialClasses: []string{"A", "B", "C", "D", "E"},
	}
	
	filterAll := models.FilterPayload{
    AgeGroups:     []string{"18-65"}, 
    Genders:       []string{"M", "F"},
    SocialClasses: []string{"A", "B", "C", "D", "E"},
}

	s.SkipIfNoData(t, filterAll, 10)

	getMetics := func(f models.FilterPayload) models.MetricsResponse {
		w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/metrics",
			models.DataRequest{Filters: &f}, r.Token(t))
		require.Equal(t, http.StatusOK, w.Code)
		var resp models.MetricsResponse
		helpers.ParseBody(t, w, &resp)
		return resp
	}

	masc := getMetics(filterMasc)
	fem  := getMetics(filterFem)
	all  := getMetics(filterAll)

	assert.LessOrEqual(t, masc.TotalAudience+fem.TotalAudience, all.TotalAudience,
		"soma de Masculino+Feminino deve ser <= total (pode haver NB e outros)")

	assert.Less(t, masc.TotalAudience, all.TotalAudience,
		"Masculino isolado deve ter menos audiência que todos os gêneros")
}

func TestMetrics_NoToken_Returns401(t *testing.T) {
	_, r := setupSuite(t)

	f := helpers.ValidSPFilter()
	body := models.DataRequest{Filters: &f}

	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/metrics", body, "")

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
