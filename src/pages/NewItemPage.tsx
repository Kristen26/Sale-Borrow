import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import LeafletMap from '../components/LeafletMap'
import TopBar from '../components/TopBar'
import { X } from 'lucide-react'

export default function NewItemPage() {
  const { session } = useAuth()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [dealType, setDealType] = useState<string>('sale')
  const [selectedAddress, setSelectedAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [description])

  useEffect(() => {
    if (dealType === 'gift') {
      setPrice('0')
    } else {
      setPrice(prev => prev === '0' ? '' : prev)
    }
  }, [dealType])

  const handleLocationSelect = (address: string, lat: number, lon: number) => {
    setSelectedAddress(address)
    setCoordinates({ lat, lon })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!session?.user) {
        throw new Error('Нет авторизации')
      }

      if (!coordinates) {
        alert('Выберите адрес')
        setLoading(false)
        return
      }

      const { data: newBuilding, error: buildingError } = await supabase
        .from('buildings')
        .insert({
          address: selectedAddress,
          coords: `SRID=4326;POINT(${coordinates.lon} ${coordinates.lat})`,
        })
        .select()
        .single()

      if (buildingError) {
        throw buildingError
      }

      const uploadedUrls: string[] = []

      for (const image of images) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, image)

        if (uploadError) {
          console.log(uploadError)
          continue
        }

        const { data } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName)

        uploadedUrls.push(data.publicUrl)
      }

      const { error: itemError } = await supabase
        .from('items')
        .insert({
          title,
          description,
          price: Number(price),
          deal_type: dealType as unknown as never,
          owner_id: session.user.id,
          building_id: newBuilding.id,
          is_active: true,
          image_urls: uploadedUrls,
        })

      if (itemError) {
        throw itemError
      }

      alert('Объявление создано')

      setTitle('')
      setPrice('')
      setDescription('')
      setDealType('sale')
      setSelectedAddress('')
      setCoordinates(null)
      setImages([])

    } catch (error) {
      console.log(error)
      alert('Ошибка создания')
    } finally {
      setLoading(false)
    }
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
        <TopBar title="Новое объявление" />

        <div 
          style={{
            ...styles.container,
            ...(isMobile && mobileStyles.containerMobile)
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={styles.block}>
              <label style={styles.label}>Название</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.block}>
              <label style={styles.label}>Тип сделки</label>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value)}
                style={styles.input}
              >
                <option value="sale">Продажа</option>
                <option value="rent">Аренда</option>
                <option value="gift">Бесплатно</option>
              </select>
            </div>

            {dealType !== 'gift' && (
              <div style={styles.block}>
                <label style={styles.label}>Цена</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required={dealType !== 'gift'}
                  style={styles.input}
                />
              </div>
            )}

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
                      setImages(prev => [
                        ...prev,
                        ...Array.from(e.target.files || []),
                      ])
                    }}
                  />
                </label>

                {images.map((image, index) => (
                  <div key={index} style={styles.previewItem}>
                    <img
                      src={URL.createObjectURL(image)}
                      style={styles.previewImage}
                      alt=""
                    />
                    <button
                      type="button"
                      style={styles.removeBtn}
                      onClick={() => {
                        setImages(prev => prev.filter((_, i) => i !== index))
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
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? 'Создание...' : 'Создать объявление'}
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
    maxWidth: '1100px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
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
