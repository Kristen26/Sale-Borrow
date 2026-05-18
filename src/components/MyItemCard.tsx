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

  const image =
    item.image_urls &&
    item.image_urls.length > 0
      ? item.image_urls[0]
      : null

  return (
    <div style={styles.card}>

      <div style={styles.imageWrap}>
        {image ? (
          <img
            src={image}
            alt={item.title}
            style={styles.image}
          />
        ) : (
          <div style={styles.placeholder}>
            Фото
          </div>
        )}
      </div>

      <div style={styles.info}>

        <div style={styles.headerRow}>
          <div style={styles.name} title={item.title}>
            {item.title}
          </div>

          <div style={styles.price}>
            {item.price} ₽
          </div>
        </div>

        <div style={styles.actions}>
          <button
            style={styles.edit}
            onClick={onEdit}
          >
            Редактировать
          </button>

          <button
            style={{
              ...styles.edit,
              ...actionStyle,
            }}
            onClick={onAction}
          >
            {actionText}
          </button>
        </div>

      </div>

    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {

  card: {
    display: 'flex',
    gap: '12px',
    background: '#fff',
    borderRadius: '18px',
    border: '1px solid #eee',
    marginBottom: '14px',
    overflow: 'hidden',
    padding: '10px',
    alignItems: 'center',
  },

  imageWrap: {
    width: '96px',
    minWidth: '96px',
    height: '96px',
    borderRadius: '14px',
    background: '#f5f5f5',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
  },

  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#999',
  },

  info: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '12px',
  },

  headerRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    width: '100%',
  },

  name: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
    lineHeight: '1.4',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  price: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#000000',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  actions: {
    display: 'flex',
    gap: '8px',
    width: '100%',
  },

  edit: {
    flex: 1,
    height: '40px',
    borderRadius: '12px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
}
