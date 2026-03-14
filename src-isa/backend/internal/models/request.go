package models

// DataRequest representa a estrutura da requisição recebida pela API
type DataRequest struct {
    // Filters contém os critérios de busca (Idade, Gênero, Classe)
    // O 'binding:"required"' avisa ao Gin que este campo não pode ser nulo
    Filters FilterPayload `json:"filters" binding:"required"`
    
    Limit   int           `json:"limit,omitempty"`
}

type FilterPayload struct {
    // Lista de faixas etárias (ex: ["65", "23", "31"])
    AgeGroups     []string `json:"ageGroups" example:"18-24,25-34"`
    
    // Lista de gêneros (ex: ["M", "F"])
    Genders       []string `json:"genders" example:"Masculino"`
    
    // Lista de classes sociais (ex: ["A", "B1", C1])
    SocialClasses []string `json:"socialClasses" example:"A,B"`
}