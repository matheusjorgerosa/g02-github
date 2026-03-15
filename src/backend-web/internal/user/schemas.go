package user

//Schema registro
type CreateUserRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=admin user"`
}

//Schema cadastro público (sem role)
type SignupRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

//Schema update
type AdminUpdateUserRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email" binding:"omitempty,email"`
	Role     string `json:"role" binding:"omitempty,oneof=admin user"`
	IsActive *bool  `json:"is_active"`
}


//Schemas login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

