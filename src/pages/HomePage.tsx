import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Tables, Enums } from '../types/database.types'
import ItemCard from '../components/card'
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

const styles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingTop: '110px',
    paddingLeft: '16px',
    paddingRight: '16px',
  },

  title: {
    fontSize: '22px',
    fontWeight: 600,
    marginBottom: '16px',
  },

  chipsContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },

  chip: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },

  loadMore: {
    textAlign: 'center' as const,
    padding: '20px',
    color: '#888',
  },
}

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [selectedDealType, setSelectedDealType] = useState<DealType | 'all'>('all')
  const [items, setItems] = useState<ItemWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const pageRef = useRef(0)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const fetchItems = useCallback(async (reset = false) => {
    if (loading) return

    setLoading(true)

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

    setLoading(false)
  }, [query, selectedDealType, loading])

  useEffect(() => {
    pageRef.current = 0
    fetchItems(true)
  }, [query, selectedDealType, fetchItems])

  useEffect(() => {
    if (loading) return

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchItems()
      }
    })

    const el = loaderRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [fetchItems, hasMore, loading])

  return (
    <>
      <TopBar
        title="Rent&Sale"
        searchValue={query}
        onSearchChange={setQuery}
      />

      <div style={styles.page}>

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

        <div style={styles.grid}>
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </>
  )
}