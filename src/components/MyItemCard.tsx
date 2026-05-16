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

        <div>
          <div style={styles.name}>
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
            style={actionStyle}
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
    borderRadius: '14px',
    border: '1px solid #eee',
    marginBottom: '12px',
    overflow: 'hidden',
  },

  imageWrap: {
    width: '110px',
    minWidth: '110px',
    height: '110px',
    background: '#f3f3f3',
  },

  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    color: '#999',
  },

  info: {
    flex: 1,
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },

  name: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '6px',
  },

  price: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#5664c1',
  },

  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  edit: {
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
  },
}