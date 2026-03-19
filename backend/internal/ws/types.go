package ws

import "github.com/google/uuid"

// Client → Server
const (
	EventTyping         = "typing"
	EventStopTyping     = "stop_typing"
	EventMarkRead       = "mark_read"
	EventCallInitiate   = "call_initiate"  // начать звонок
	EventCallAccept     = "call_accept"    // принять
	EventCallDecline    = "call_decline"   // отклонить
	EventCallEnd        = "call_end"       // завершить
	EventWebRTCOffer    = "webrtc_offer"
	EventWebRTCAnswer   = "webrtc_answer"
	EventWebRTCICE      = "webrtc_ice"
)

// Server → Client
const (
	EventNewMessage     = "new_message"
	EventMessageEdited  = "message_edited"
	EventMessageDeleted = "message_deleted"
	EventReaction       = "reaction"
	EventUserOnline     = "user_online"
	EventUserOffline    = "user_offline"
	EventUserTyping     = "user_typing"
	EventUserStopTyping = "user_stop_typing"
	EventMessageRead    = "message_read"
	EventCallIncoming   = "call_incoming"   // входящий
	EventCallAccepted   = "call_accepted"   // принят
	EventCallDeclined   = "call_declined"   // отклонён
	EventCallEnded      = "call_ended"      // завершён
	EventCallWebRTC     = "call_webrtc"     // WebRTC сигналинг
	EventError          = "error"
)

type IncomingEvent struct {
	Type    string         `json:"type"`
	Payload map[string]any `json:"payload"`
}

type OutgoingEvent struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

func parseUUID(payload map[string]any, key string) uuid.UUID {
	val, ok := payload[key]
	if !ok {
		return uuid.Nil
	}
	str, ok := val.(string)
	if !ok {
		return uuid.Nil
	}
	id, err := uuid.Parse(str)
	if err != nil {
		return uuid.Nil
	}
	return id
}
