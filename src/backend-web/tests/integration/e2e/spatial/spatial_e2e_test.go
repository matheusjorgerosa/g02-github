package spatial

import (
	"net/http"
	"testing"
	"backend-web/internal/flow/models"
	"backend-web/tests/integration/e2e/helpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var suite *helpers.E2ESuite

func TestMain(m *testing.M) {
	m.Run()
}

func setupSuite(t *testing.T) (*helpers.E2ESuite, *helpers.RouterForTest) {
	t.Helper()
	s := helpers.NewE2ESuite(t)
	t.Cleanup(s.Close)
	router := helpers.NewTestRouter(s)
	return s, &helpers.RouterForTest{Engine: router}
}

func TestSpatial_ValidFilters_ReturnsSPPoints(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/spatial", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code, "response: %s", w.Body.String())

	var resp struct {
		Data []models.SpatialResponse `json:"data"`
	}
	helpers.ParseBody(t, w, &resp)

	assert.NotEmpty(t, resp.Data, "filtros válidos deveriam retornar pelo menos 1 ponto")

	for i, p := range resp.Data {
		assert.NotZero(t, p.Latitude,  "ponto[%d]: latitude não deveria ser zero", i)
		assert.NotZero(t, p.Longitude, "ponto[%d]: longitude não deveria ser zero", i)
		assert.Greater(t, p.Volume, int64(0), "ponto[%d]: Volume (weighted_uniques) deveria ser > 0", i)
	}

}

func TestSpatial_VolumeFieldMapping(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/spatial", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var rawResp map[string][]map[string]interface{}
	helpers.ParseBody(t, w, &rawResp)

	data, ok := rawResp["data"]
	require.True(t, ok, "envelope 'data' ausente")
	require.NotEmpty(t, data)

	firstPoint := data[0]
	_, hasWeightedUniques := firstPoint["weighted_uniques"]
	_, hasVolume := firstPoint["volume"]

	assert.True(t, hasWeightedUniques,
		"campo JSON deveria ser 'weighted_uniques' (ver spatial.go: json:\"weighted_uniques\" bigquery:\"volume\")")
	assert.False(t, hasVolume,
		"campo 'volume' não deveria aparecer no JSON — o tag json define 'weighted_uniques'")
}

func TestSpatial_EmptyFilters_ReturnsEmptyData(t *testing.T) {
	_, r := setupSuite(t)

	f := helpers.EmptyFilter()
	body := models.DataRequest{Filters: &f}

	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/spatial", body, r.Token(t))

	
	require.Equal(t, http.StatusOK, w.Code,
		"arrays vazios não são erro de binding (filters está presente) — deveria ser 200")

	var resp struct {
		Data []models.SpatialResponse `json:"data"`
	}
	helpers.ParseBody(t, w, &resp)

	assert.Empty(t, resp.Data,
		"RISCO 1: arrays vazios resultam em zero pontos — UNNEST([]) retorna vazio no BigQuery. "+
			"Discutir com a equipe se este é o comportamento esperado.")
}

func TestSpatial_MissingFilters_Returns400(t *testing.T) {
	_, r := setupSuite(t)

	body := map[string]any{"limit": 10}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/spatial", body, r.Token(t))

	require.Equal(t, http.StatusBadRequest, w.Code,
		"campo 'filters' tem binding:\"required\" — deveria retornar 400")

	var errResp map[string]string
	helpers.ParseBody(t, w, &errResp)
	assert.Equal(t, "Filtros inválidos", errResp["error"])
}

func TestSpatial_AgeRange_18to24(t *testing.T) {
	s, r := setupSuite(t)

	filters := models.FilterPayload{
		AgeGroups:     []string{"18-24", "25-34"},
		Genders:       []string{"M", "F"},
		SocialClasses: []string{"A", "B1", "C"},
	}
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/spatial", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Data []models.SpatialResponse `json:"data"`
	}
	helpers.ParseBody(t, w, &resp)

	assert.NotEmpty(t, resp.Data,
		"faixa 18-24 expandida para [18..24] deveria ter resultados no dataset")
}

func TestSpatial_MalformedAgeRange_ReturnsEmpty(t *testing.T) {
	_, r := setupSuite(t)

	filters := models.FilterPayload{
		AgeGroups:     []string{"abc-def"},
		Genders:       []string{"M"},
		SocialClasses: []string{"B"},
	}

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/spatial", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code,
		"faixa malformada não deveria causar erro — é ignorada silenciosamente")

	var resp struct {
		Data []models.SpatialResponse `json:"data"`
	}
	helpers.ParseBody(t, w, &resp)
	assert.Empty(t, resp.Data,
		"RISCO 2: faixa malformada ignorada → @ages=[] → UNNEST([]) → vazio (sem erro retornado)")
}

func TestSpatial_NoToken_Returns401(t *testing.T) {
	_, r := setupSuite(t)

	f := helpers.ValidSPFilter()
	body := models.DataRequest{Filters: &f}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/spatial", body, "")

	assert.Equal(t, http.StatusUnauthorized, w.Code,
		"rota protegida por AuthMiddleware — sem token deve retornar 401")
}
