package demographics

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

func TestDemographics_PercentageSum_NearHundred(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 10)

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/distribution/demographics", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code, "response: %s", w.Body.String())

	var resp models.DemographicsResponse
	helpers.ParseBody(t, w, &resp)

	assert.NotEmpty(t, resp.Gender,      "distribuição de gênero não deveria estar vazia")
	assert.NotEmpty(t, resp.SocialClass, "distribuição de classe social não deveria estar vazia")

	helpers.AssertPercentageSum(t, resp.Gender,      "gender")
	helpers.AssertPercentageSum(t, resp.SocialClass, "socialClass")
}

func TestDemographics_CategoryValues_Valid(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/distribution/demographics", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp models.DemographicsResponse
	helpers.ParseBody(t, w, &resp)

	allCategories := append(resp.Gender, resp.SocialClass...)
	for i, cat := range allCategories {
		assert.NotEmpty(t, cat.Category,
			"item[%d]: category não deveria ser vazio", i)
		assert.Greater(t, cat.Volume, int64(0),
			"item[%d] category='%s': volume deveria ser > 0 (COUNT(*) > 0 pois a categoria existe)", i, cat.Category)
		assert.GreaterOrEqual(t, cat.Percentage, 0.0,
			"item[%d] category='%s': percentagem não deveria ser negativa", i, cat.Category)
		assert.LessOrEqual(t, cat.Percentage, 100.0,
			"item[%d] category='%s': percentagem não deveria ultrapassar 100", i, cat.Category)
	}
}

func TestDemographics_SingleGenderFilter_GenderHundredPercent(t *testing.T) {
	s, r := setupSuite(t)

	filters := models.FilterPayload{
		AgeGroups:     []string{"18-24", "25-34"},
		Genders:       []string{"M"},
		SocialClasses: []string{"A", "B1", "C"},
	}
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/distribution/demographics", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp models.DemographicsResponse
	helpers.ParseBody(t, w, &resp)

	require.Len(t, resp.Gender, 1,
		"filtro por gênero único deveria retornar apenas 1 categoria em gender")
	assert.Equal(t, "M", resp.Gender[0].Category)
	assert.InDelta(t, 100.0, resp.Gender[0].Percentage, 0.1,
		"única categoria deveria ter percentagem ~100%% (window function sobre conjunto filtrado)")
}

func TestDemographics_ResponseKeys(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 1)

	body := models.DataRequest{Filters: &filters}
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/distribution/demographics", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var raw map[string]interface{}
	helpers.ParseBody(t, w, &raw)

	_, hasGender := raw["gender"]
	assert.True(t, hasGender, "chave 'gender' deve existir (json:\"gender\" em DemographicsResponse)")

	_, hasSocialClass := raw["socialClass"]
	assert.True(t, hasSocialClass, "chave 'socialClass' deve existir (json:\"socialClass\" em DemographicsResponse)")

	_, hasData := raw["data"]
	assert.False(t, hasData,
		"demographics NÃO usa envelope 'data' — handler retorna dist diretamente (não gin.H{\"data\": dist})")
}

func TestDemographics_TwoQueries_ConsistentInStaticDataset(t *testing.T) {
	s, r := setupSuite(t)

	filters := helpers.ValidSPFilter()
	s.SkipIfNoData(t, filters, 10)

	call := func() models.DemographicsResponse {
		w := helpers.DoRequest(t, r.Engine, http.MethodPost,
			"/api/v1/flow/distribution/demographics",
			models.DataRequest{Filters: &filters}, r.Token(t))
		require.Equal(t, http.StatusOK, w.Code)
		var resp models.DemographicsResponse
		helpers.ParseBody(t, w, &resp)
		return resp
	}

	resp1 := call()
	resp2 := call()

	assert.Equal(t, len(resp1.Gender), len(resp2.Gender),
		"RISCO 5: mesmo filtro deve retornar mesmo número de categorias de gênero "+
			"em dataset estático (as duas queries internas retornam dados consistentes)")
	assert.Equal(t, len(resp1.SocialClass), len(resp2.SocialClass),
		"RISCO 5: mesmo filtro deve retornar mesmo número de classes sociais "+
			"em dataset estático")

	for i := range resp1.Gender {
		if i < len(resp2.Gender) {
			assert.Equal(t, resp1.Gender[i].Category, resp2.Gender[i].Category,
				"categoria[%d] de gênero deveria ser igual entre duas chamadas idênticas", i)
			assert.Equal(t, resp1.Gender[i].Volume, resp2.Gender[i].Volume,
				"volume[%d] de gênero deveria ser igual em dataset estático", i)
		}
	}

	t.Log("RISCO 5 documentado: em ambiente com ingestão ativa, " +
		"as duas queries sequenciais (genero e classe_social) podem retornar estados diferentes do BigQuery.")
}

func TestDemographics_EmptyFilters_ReturnsEmptyDistributions(t *testing.T) {
	_, r := setupSuite(t)

	f := helpers.EmptyFilter()
	body := models.DataRequest{Filters: &f}
	
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/distribution/demographics", body, r.Token(t))

	require.Equal(t, http.StatusOK, w.Code)

	var resp models.DemographicsResponse
	helpers.ParseBody(t, w, &resp)

	assert.Empty(t, resp.Gender,
		"RISCO 1: filtros vazios → UNNEST([]) → zero linhas → gender vazio/nil")
	assert.Empty(t, resp.SocialClass,
		"RISCO 1: filtros vazios → UNNEST([]) → zero linhas → socialClass vazio/nil")
}

func TestDemographics_NoToken_Returns401(t *testing.T) {
	_, r := setupSuite(t)

	f := helpers.ValidSPFilter()
	body := models.DataRequest{Filters: &f}
	
	w := helpers.DoRequest(t, r.Engine, http.MethodPost, "/api/v1/flow/distribution/demographics", body, "")

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
