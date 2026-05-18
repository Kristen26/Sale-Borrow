import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Tables, Enums } from '../types/database.types'
import ItemCard from '../components/ItemCard'
import TopBar from '../components/TopBar'

type Profile = Tables<'profiles'>
type Building = Tables<'buildings'>

type ItemWithDetails = Tables<'items'> & {
  owner: Profile
  building: Building
}

type DealType = Enums<'deal_type'>

const PAGE_SIZE = 12

const FILTER_COLORS = {
  activeBg: '#5664c1',
  activeText: '#fff',
  defaultBg: '#fff',
  defaultText: '#333',
  border: '#ddd',
}

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [selectedDealType, setSelectedDealType] = useState<DealType | 'all'>('all')
  const [items, setItems] = useState<ItemWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const pageRef = useRef(0)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchItems = useCallback(async (reset = false) => {
    const page = reset ? 0 : pageRef.current
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let request = supabase
      .from('items')
      .select(`
        *,
        owner:profiles(*),
        building:buildings(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (selectedDealType !== 'all') {
      request = request.eq('deal_type', selectedDealType)
    }

    if (query.trim()) {
      request = request.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { data } = await request

    if (data) {
      const typed = data as ItemWithDetails[]

      setItems(prev => {
        if (reset) return typed
        const map = new Map()
        ;[...prev, ...typed].forEach(item => {
          map.set(item.id, item)
        })
        return Array.from(map.values())
      })
      setHasMore(typed.length === PAGE_SIZE)
      pageRef.current = reset ? 1 : pageRef.current + 1
    }
  }, [query, selectedDealType])

  useEffect(() => {
    pageRef.current = 0
    
    const initFetch = async () => {
      await fetchItems(true)
    }
    
    initFetch()
  }, [query, selectedDealType, fetchItems])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasMore && !loading) {
        setLoading(true)
        fetchItems().finally(() => setLoading(false))
      }
    })

    const el = loaderRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [fetchItems, hasMore, loading])

  return (
    <div style={layout.page}>
      <div 
        style={{
          ...layout.centered,
          ...(isMobile && mobileStyles.centeredMobile)
        }}
      >
        <TopBar
          title="Rent&Sale"
          searchValue={query}
          onSearchChange={setQuery}
        />

        <div 
          style={{
            ...styles.container,
            ...(isMobile && mobileStyles.containerMobile)
          }}
        >
          <div style={styles.chipsContainer}>
            {['all', 'gift', 'rent', 'sale'].map(type => {
              const active = selectedDealType === type

              return (
                <button
                  key={type}
                  onClick={() => setSelectedDealType(type as DealType | 'all')}
                  style={{
                    ...styles.chip,
                    background: active ? FILTER_COLORS.activeBg : FILTER_COLORS.defaultBg,
                    color: active ? FILTER_COLORS.activeText : FILTER_COLORS.defaultText,
                    border: `1px solid ${FILTER_COLORS.border}`,
                  }}
                >
                  {type === 'all' ? 'все' :
                   type === 'gift' ? 'даром' :
                   type === 'rent' ? 'аренда' : 'продажа'}
                </button>
              )
            })}
          </div>

          <div 
            style={{
              ...styles.grid,
              ...(isMobile && mobileStyles.gridMobile)
            }}
          >
            {items.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          <div ref={loaderRef} style={styles.loadMore}>
            {loading && 'Загрузка объявлений...'}
          </div>
        </div>
      </div>
    </div>
  )
}

const layout = {
  page: {
    background: '#eee',
    minHeight: '100vh',
  },
  centered: {
    maxWidth: '1200px',
    margin: '0 auto',
    background: '#F8F9FA',
    minHeight: '100vh',
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    paddingTop: '110px',
    paddingLeft: '16px',
    paddingRight: '16px',
    paddingBottom: '80px',
    textAlign: 'left',
  },
  chipsContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  chip: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    justifyContent: 'flex-start',
  },
  loadMore: {
    textAlign: 'center',
    padding: '20px',
    color: '#888',
    fontSize: '14px',
  },
}

const mobileStyles: Record<string, React.CSSProperties> = {
  centeredMobile: {
    maxWidth: '100%',
  },
  containerMobile: {
    paddingTop: '90px',
    paddingLeft: '12px',
    paddingRight: '12px',
    paddingBottom: '80px',
  },
  gridMobile: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
}
