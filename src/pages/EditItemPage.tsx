import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import YandexMap from '../components/LeafletMap'
import type { Enums, Tables } from '../types/database.types'

type DealType = Enums<'deal_type'>
type Item = Tables<'items'>

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()

  const [item, setItem] = useState<Item | null>(null)

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [dealType, setDealType] = useState<DealType>('sale')

  const [selectedAddress, setSelectedAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 📦 загрузка объявления
  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data } = await supabase
        .from('items')
        .select(`
          *,
          building:buildings(*)
        `)
        .eq('id', id)
        .single()

      if (data) {
        setItem(data)

        setTitle(data.title)
        setPrice(String(data.price))
        setDescription(data.description || '')
        setDealType(data.deal_type)

        if (data.building) {
          setSelectedAddress(data.building.address)
        }
      }

      setLoading(false)
    }

    load()
  }, [id])

  // 📍 карта
  const handleLocationSelect = (address: string, lat: number, lon: number) => {
    setSelectedAddress(address)
    setCoordinates({ lat, lon })
  }

  // 💾 сохранение
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!item || !session) return

    setSaving(true)

    try {
      let buildingId = item.building_id

      // если меняли адрес — обновим building
      if (coordinates) {
        const { data: newBuilding } = await supabase
          .from('buildings')
          .insert({
            address: selectedAddress,
            coords: `SRID=4326;POINT(${coordinates.lon} ${coordinates.lat})`,
          })
          .select()
          .single()

        if (newBuilding) {
          buildingId = newBuilding.id
        }
      }

      // 🔥 update
      const { error } = await supabase
        .from('items')
        .update({
          title,
          price: Number(price),
          description,
          deal_type: dealType,
          building_id: buildingId,
        })
        .eq('id', item.id)

      if (error) throw error

      alert('Сохранено ✅')
      navigate(-1)

    } catch (err) {
      console.error(err)
      alert('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>

  return (
    <div style={{ padding: 20, paddingBottom: 100 }}>
      
      <button onClick={() => navigate(-1)} style={{ marginBottom: 10 }}>
        ← Назад
      </button>

      <h1>Редактировать объявление</h1>

      <form onSubmit={handleSave}>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название"
          style={input}
        />

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Цена"
          style={input}
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание"
          style={{ ...input, height: 100 }}
        />

        <select
          value={dealType}
          onChange={(e) => setDealType(e.target.value as DealType)}
          style={input}
        >
          <option value="sale">Продажа</option>
          <option value="rent">Аренда</option>
          <option value="gift">Даром</option>
        </select>

        {/* карта */}
        <YandexMap onLocationSelect={handleLocationSelect} />

        {selectedAddress && (
          <div style={{ marginTop: 10 }}>
            📍 {selectedAddress}
          </div>
        )}

        <button disabled={saving} style={btn}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>

      </form>
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '8px',
  border: '1px solid #ccc'
}

const btn: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: '#000',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  marginTop: 20
}