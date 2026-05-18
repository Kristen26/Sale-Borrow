import { useEffect, useState, useRef } from "react"
import { supabase } from "../lib/supabaseClient"
import { useParams } from "react-router-dom"

type Message = {
  id: string
  chat_id: string
  sender_id: string
  content: string | null
  created_at: string
}

type ChatInfo = {
  id: string
  item: { title: string } | null
  seller: {
    first_name: string
    last_name: string | null
  } | null
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()

  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      setUserId(userData.user?.id ?? null)

      const { data: chat } = await supabase
        .from("chats")
        .select(`
          id,
          item:items(title),
          seller:profiles!chats_seller_id_fkey(first_name, last_name)
        `)
        .eq("id", id)
        .single()

      setChatInfo(chat as ChatInfo)

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", id)
        .order("created_at", { ascending: true })

      setMessages((msgs as Message[]) || [])
    }

    load()
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!text.trim() || !id || !userId) return

    const currentText = text
    setText("")

    // Метод .select() заставляет Supabase вернуть созданную запись из базы данных
    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: id,
        sender_id: userId,
        content: currentText,
      })
      .select()

    if (error) {
      setText(currentText)
    } else if (data && data.length > 0) {
      // Сразу же добавляем новую запись в локальный стейт для мгновенного рендера
      const createdMessage = data[0] as Message
      setMessages((prev) => [...prev, createdMessage])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  return (
    <div style={layout.page}>
      <div style={layout.centered}>

        <div style={styles.header}>
          <div style={styles.title}>
            {chatInfo?.item?.title || "Товар"}
          </div>
          <div style={styles.subtitle}>
            {chatInfo?.seller
              ? `${chatInfo.seller.first_name} ${chatInfo.seller.last_name ?? ""}`
              : "Продавец"}
          </div>
        </div>

        <div style={styles.messages}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent:
                  msg.sender_id === userId ? "flex-end" : "flex-start",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  background:
                    msg.sender_id === userId ? "#7bd194" : "#f1f1f1",
                  color:
                    msg.sender_id === userId ? "#ffffff" : "#111111",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={styles.inputWrap}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение..."
            style={styles.input}
          />
          <button onClick={sendMessage} style={styles.sendBtn}>
            Отправить
          </button>
        </div>

      </div>
    </div>
  )
}

const layout = {
  page: {
    background: "#eee",
    height: "100dvh",
    overflow: "hidden",
    position: "relative" as const,
  },

  centered: {
    maxWidth: "1200px",
    margin: "0 auto",
    background: "#ffffff",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    position: "relative" as const,
  },
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: "16px",
    borderBottom: "1px solid #e0e0e0",
    textAlign: "center",
    background: "#fff",
    flexShrink: 0,
    zIndex: 10,
  },

  title: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#246ca7",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  subtitle: {
    fontSize: "13px",
    color: "#666",
    marginTop: "2px",
  },

  messages: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
    background: "#fafafa",
    WebkitOverflowScrolling: "touch" as const,
  },

  bubble: {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: "16px",
    fontSize: "15px",
    lineHeight: "1.4",
    wordBreak: "break-word",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },

  inputWrap: {
    display: "flex",
    gap: "10px",
    padding: "12px 16px",
    background: "#ffffff",
    borderTop: "1px solid #e0e0e0",
    flexShrink: 0,
    boxSizing: "border-box",
    zIndex: 10,
  },

  input: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: "20px",
    border: "1px solid #ced4da",
    background: "#fff",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  },

  sendBtn: {
    padding: "0 18px",
    background: "#7bd194",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
  },
}
