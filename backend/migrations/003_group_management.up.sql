-- Group permissions stored as JSONB on chats
ALTER TABLE chats ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "can_send_messages": true,
  "can_send_media": true,
  "can_add_members": false,
  "can_pin_messages": false,
  "can_change_info": false,
  "can_invite_users": true
}';

-- Admin action log
CREATE TABLE IF NOT EXISTS admin_actions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id     UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    actor_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(64) NOT NULL,
    details     JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_actions_chat_id ON admin_actions (chat_id, created_at DESC);
