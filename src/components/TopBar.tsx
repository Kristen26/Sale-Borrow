import type { FC } from 'react'

type Props = {
  title: string
  searchValue?: string
  onSearchChange?: (v: string) => void
}

const TopBar: FC<Props> = ({ title, searchValue, onSearchChange }) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.inner}>

        <div style={styles.row}>
          {/* ЛОГО / НАЗВАНИЕ */}
          <div style={styles.title}>{title}</div>

          {/* ПОИСК */}
          {onSearchChange && (
            <div style={styles.searchWrap}>
              <input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Поиск объявлений"
                style={styles.input}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default TopBar

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '#5664c1',
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
    zIndex: 100,
  },

  inner: {
    maxWidth: '1200px', // 🔥 теперь десктоп
    margin: '0 auto',
    padding: '12px 16px 16px',
  },

  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  title: {
    color: '#fff',
    fontSize: '20px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  searchWrap: {
    flex: 1,
    background: '#fff',
    borderRadius: '20px',
    padding: '8px 14px',
  },

  input: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
  },
}