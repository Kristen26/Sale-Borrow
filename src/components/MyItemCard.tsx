import type { Tables } from '../types/database.types'

type Item = Tables<'items'>

type Props = {
  item: Item
  onEdit: () => void
  onAction: () => void
  actionText: string
  actionStyle: React.CSSProperties
}

export default function MyItemCard({
  item,
  onEdit,
  onAction,
  actionText,
  actionStyle,
}: Props) {
  return (
    <div style={styles.card}>
      <div style={styles.imageWrap}>
        {item.image_urls?.[0] ? (
          <img src={item.image_urls[0]} style={styles.image} />
        ) : (
          <div style={styles.placeholder}>📷</div>
        )}
      </div>

      <div style={styles.info}>
        <div>
          <div style={styles.name}>{item.title}</div>
          <div style={styles.price}>{item.price} ₽</div>
        </div>

        <div style={styles.actions}>
          <button style={styles.edit} onClick={onEdit}>
            Редактировать
          </button>

          <button style={actionStyle} onClick={onAction}>
            {actionText}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    display: 'flex',
    gap: '10px',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #eee',
    marginBottom: '10px',
  },
  imageWrap: {
    width: '90px',
    height: '100px',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f0f0',
  },
  info: {
    flex: 2,
    padding: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: '17px',
    fontWeight: 500,
  },
  price: {
    fontSize: '15px',
    fontWeight: 600,
    marginTop: '4px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  edit: {
    padding: '6px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
  },
  restore: {
    padding: '6px',
    borderRadius: '8px',
    border: 'none',
    background: '#4caf50',
    color: '#fff',
    cursor: 'pointer',
  },
  stop: {
    padding: '6px',
    borderRadius: '8px',
    border: 'none',
    background: '#e39865',
    color: '#fff',
    cursor: 'pointer',
  },
}