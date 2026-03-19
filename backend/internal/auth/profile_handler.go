package auth

import (
	"github.com/gofiber/fiber/v2"
)

type ProfileHandler struct {
	repo *Repository
}

func NewProfileHandler(repo *Repository) *ProfileHandler {
	return &ProfileHandler{repo: repo}
}

// PATCH /api/users/me
func (h *ProfileHandler) UpdateProfile(c *fiber.Ctx) error {
	userID := GetUserIDFromCtx(c)

	var body struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Bio       string `json:"bio"`
	}
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid body")
	}

	if err := h.repo.UpdateProfile(c.Context(), userID, body.FirstName, body.LastName, body.Bio); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to update profile")
	}

	user, err := h.repo.GetUserByID(c.Context(), userID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to fetch user")
	}

	return c.JSON(user)
}
