package models

import (
	"time"

	"github.com/google/uuid"
)

type Mention struct {
	ID              uuid.UUID  `db:"id" json:"id"`
	MessageID       uuid.UUID  `db:"message_id" json:"message_id"`
	ChatID          uuid.UUID  `db:"chat_id" json:"chat_id"`
	SenderID        *uuid.UUID `db:"sender_id" json:"sender_id,omitempty"`
	MentionedUserID uuid.UUID  `db:"mentioned_user_id" json:"mentioned_user_id"`
	IsRead          bool       `db:"is_read" json:"is_read"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
}
