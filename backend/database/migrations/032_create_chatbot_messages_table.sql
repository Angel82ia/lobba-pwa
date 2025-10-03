CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(10) CHECK (sender_type IN ('user', 'bot')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chatbot_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX idx_chatbot_messages_created_at ON chatbot_messages(created_at DESC);
