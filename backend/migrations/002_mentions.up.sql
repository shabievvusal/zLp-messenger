CREATE TABLE IF NOT EXISTS mentions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id        UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    chat_id           UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentions_user ON mentions (mentioned_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_message ON mentions (message_id);
