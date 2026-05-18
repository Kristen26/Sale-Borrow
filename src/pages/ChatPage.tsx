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

    await supabase.from("messages").insert({
      chat_id: id,
      sender_id: userId,
      content: text,
    })

    setText("")

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", id)
      .order("created_at", { ascending: true })

    setMessages((data as Message[]) || [])
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
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  background:
                    msg.sender_id === userId ? "#7bd194" : "#eee",
                  color:
                    msg.sender_id === userId ? "#fff" : "#000",
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
    height: "100vh",
    overflow: "hidden",
  },

  centered: {
    maxWidth: "1200px",
    margin: "0 auto",
    background: "#ffffff",
    height: "100vh",
    display: "flex",
    flexDirection: "column" as const,
  },
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: "16px",
    borderBottom: "1px solid #c9c3c3",
    textAlign: "center",
    background: "#fff",
    flexShrink: 0,
  },

  title: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#246ca7",
  },

  subtitle: {
    fontSize: "13px",
    color: "#2c3c49",
  },

  messages: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
  },

  bubble: {
    maxWidth: "60%",
    padding: "10px 12px",
    borderRadius: "12px",
    fontSize: "14px",
    wordBreak: "break-word",
  },

  inputWrap: {
    display: "flex",
    gap: "10px",
    padding: "12px",
    background: "#ffffff",
    borderTop: "1px solid #ccc",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #98aed4",
    background: "#fff",
    fontSize: "15px",
    outline: "none",
  },

  sendBtn: {
    padding: "10px 14px",
    background: "#7bd194",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
}
