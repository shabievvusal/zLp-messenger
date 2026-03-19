package auth

import (
	"github.com/gofiber/fiber/v2"
	"github.com/zlp-messenger/backend/internal/models"
)

type SearchHandler struct {
	repo *SearchRepository
}

func NewSearchHandler(repo *SearchRepository) *SearchHandler {
	return &SearchHandler{repo: repo}
}

// GET /api/users/search?q=username
func (h *SearchHandler) SearchUsers(c *fiber.Ctx) error {
	q := c.Query("q")
	if len(q) < 2 {
		return fiber.NewError(fiber.StatusBadRequest, "query must be at least 2 characters")
	}

	users, err := h.repo.SearchUsers(c.Context(), q, 20)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "search failed")
	}
	if users == nil {
		users = []models.PublicUser{}
	}
	return c.JSON(users)
}
