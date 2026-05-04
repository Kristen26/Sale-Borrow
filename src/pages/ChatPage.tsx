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

  // 🔥 загрузка
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

  // 🔥 авто-скролл вниз
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 🔥 отправка
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

  return (
    <div style={layout.page}>
      <div style={layout.centered}>

        {/* HEADER */}
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

        {/* СООБЩЕНИЯ */}
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
                    msg.sender_id === userId ? "#5664c1" : "#eee",
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

        {/* INPUT */}
        <div style={styles.inputWrap}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
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
    minHeight: "100vh",
  },

  centered: {
    maxWidth: "1200px",
    margin: "0 auto",
    background: "#ececec",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: "16px",
    borderBottom: "1px solid #373a90",
    textAlign: "center",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 5,
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
    background: "#ececec",
    borderTop: "1px solid #ccc",
    marginBottom: "20px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #6c8eca",
  },

  sendBtn: {
    padding: "10px 14px",
    background: "#5664c1",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
}