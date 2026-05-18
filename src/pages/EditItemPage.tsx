import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import LeafletMap from '../components/LeafletMap'
import TopBar from '../components/TopBar'
import { X } from 'lucide-react'
import type { Tables, Enums } from '../types/database.types'

type Item = Tables<'items'>
type DealType = Enums<'deal_type'>

export default function EditItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [item, setItem] = useState<Item | null>(null)

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [dealType, setDealType] = useState<DealType>('sale')
  const [selectedAddress, setSelectedAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!id) return

    const loadItem = async () => {
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
        setExistingImages(data.image_urls || [])

        if (data.building) {
          setSelectedAddress(data.building.address)
        }
      }
      setLoading(false)
    }

    loadItem()
  }, [id])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [description])

  const handleLocationSelect = (address: string, lat: number, lon: number) => {
    setSelectedAddress(address)
    setCoordinates({ lat, lon })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !session) return

    setSaving(true)

    try {
      let buildingId = item.building_id

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

      const uploadedUrls: string[] = []

      for (const image of newImages) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`

        const { error } = await supabase.storage
          .from('item-images')
          .upload(fileName, image)

        if (error) {
          console.log(error)
          continue
        }

        const { data } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName)

        uploadedUrls.push(data.publicUrl)
      }

      const finalImages = [...existingImages, ...uploadedUrls]

      const { error } = await supabase
        .from('items')
        .update({
          title,
          price: Number(price),
          description,
          deal_type: dealType,
          building_id: buildingId,
          image_urls: finalImages,
        })
        .eq('id', item.id)

      if (error) {
        throw error
      }

      alert('Сохранено')
      navigate(-1)
    } catch (err) {
      console.log(err)
      alert('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'left' }}>Загрузка...</div>
  }

  return (
    <div style={layout.page}>
      <style>{`
        .leaflet-control-attribution, 
        .leaflet-control-zoom { 
          display: none !important; 
        }
      `}</style>

      <div 
        style={{
          ...layout.centered,
          ...(isMobile && mobileStyles.centeredMobile)
        }}
      >
        <TopBar title="Редактировать объявление" />

        <div 
          style={{
            ...styles.container,
            ...(isMobile && mobileStyles.containerMobile)
          }}
        >
          <form onSubmit={handleSave}>
            <div style={styles.block}>
              <label style={styles.label}>Название</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.block}>
              <label style={styles.label}>Цена</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.block}>
              <label style={styles.label}>Описание</label>
              <textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите ваш товар или услугу"
                maxLength={800}
                style={styles.textarea}
                rows={1}
              />
              <div style={styles.counter}>
                {description.length} / 800
              </div>
            </div>

            <div style={styles.block}>
              <label style={styles.label}>Тип сделки</label>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value as DealType)}
                style={styles.input}
              >
                <option value="sale">Продажа</option>
                <option value="rent">Аренда</option>
                <option value="gift">Даром</option>
              </select>
            </div>

            <div style={styles.block}>
              <div style={styles.label}>Добавить фото</div>
              <div style={styles.previewGrid}>
                <label style={styles.uploadBox}>
                  <div style={styles.plus}>+</div>
                  <input
                    hidden
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (!e.target.files) return
                      setNewImages(prev => [
                        ...prev,
                        ...Array.from(e.target.files || []),
                      ])
                    }}
                  />
                </label>

                {existingImages.map((image, index) => (
                  <div key={`existing-${index}`} style={styles.previewItem}>
                    <img src={image} style={styles.previewImage} alt="" />
                    <button
                      type="button"
                      style={styles.removeBtn}
                      onClick={() => {
                        setExistingImages(prev => prev.filter((_, i) => i !== index))
                      }}
                    >
                      <X size={14} color="#fff" />
                    </button>
                  </div>
                ))}

                {newImages.map((image, index) => (
                  <div key={`new-${index}`} style={styles.previewItem}>
                    <img src={URL.createObjectURL(image)} style={styles.previewImage} alt="" />
                    <button
                      type="button"
                      style={styles.removeBtn}
                      onClick={() => {
                        setNewImages(prev => prev.filter((_, i) => i !== index))
                      }}
                    >
                      <X size={14} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.block}>
              <label style={styles.label}>Местоположение</label>
              <LeafletMap onLocationSelect={handleLocationSelect} />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={styles.submitBtn}
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
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
    padding: '110px 16px 80px',
    textAlign: 'left',
    maxWidth: '800px',
    margin: '0 auto',
  },
  block: {
    marginBottom: '20px',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: 600,
    fontSize: '16px',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    background: '#fff',
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    overflowY: 'hidden',
    resize: 'none',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    background: '#fff',
    lineHeight: '1.5',
    display: 'block',
  },
  counter: {
    fontSize: '12px',
    color: '#888',
    textAlign: 'right',
    marginTop: '4px',
  },
  previewGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'flex-start',
  },
  uploadBox: {
    width: '110px',
    height: '110px',
    borderRadius: '14px',
    border: '2px dashed #d5d5d5',
    background: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  plus: {
    fontSize: '42px',
    color: '#999',
  },
  previewItem: {
    width: '110px',
    height: '110px',
    position: 'relative',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid #ddd',
    background: '#f5f5f5',
    boxSizing: 'border-box',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 0.5)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: '#5664c1',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '16px',
    boxSizing: 'border-box',
    marginTop: '10px',
  },
}

const mobileStyles: Record<string, React.CSSProperties> = {
  centeredMobile: {
    maxWidth: '100%',
  },
  containerMobile: {
    padding: '90px 12px 80px',
  },
}
