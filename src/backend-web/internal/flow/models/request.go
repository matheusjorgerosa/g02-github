package models

// DataRequest representa a estrutura da requisição recebida pela API
type DataRequest struct {
	// Alterar para *FilterPayload (ponteiro)
	Filters *FilterPayload `json:"filters" binding:"required"`

	Limit int `json:"limit,omitempty"`
}

type FilterPayload struct {
	// Lista de faixas etárias (ex: ["65", "23", "31"])
	AgeGroups []string `json:"ageGroups" example:"18-24,25-34"`

	// Lista de gêneros (ex: ["M", "F"])
	Genders []string `json:"genders" example:"Masculino"`

	// Lista de classes sociais (ex: ["A", "B1", C1])
	SocialClasses []string `json:"socialClasses" example:"A,B"`
}
