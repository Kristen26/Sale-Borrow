// pages/EditItemPage.tsx

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import YandexMap from '../components/LeafletMap'
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

  const [dealType, setDealType] =
    useState<DealType>('sale')

  const [selectedAddress, setSelectedAddress] =
    useState('')

  const [coordinates, setCoordinates] =
    useState<{ lat: number; lon: number } | null>(null)

  // СТАРЫЕ ФОТО
  const [existingImages, setExistingImages] =
    useState<string[]>([])

  // НОВЫЕ ФОТО
  const [newImages, setNewImages] =
    useState<File[]>([])

  // ЗАГРУЗКА ОБЪЯВЛЕНИЯ
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

        setDescription(
          data.description || ''
        )

        setDealType(data.deal_type)

        setExistingImages(
          data.image_urls || []
        )

        if (data.building) {

          setSelectedAddress(
            data.building.address
          )
        }
      }

      setLoading(false)
    }

    loadItem()

  }, [id])

  // ВЫБОР АДРЕСА
  const handleLocationSelect = (
    address: string,
    lat: number,
    lon: number
  ) => {

    setSelectedAddress(address)

    setCoordinates({
      lat,
      lon,
    })
  }

  // СОХРАНЕНИЕ
  const handleSave = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    if (!item || !session) return

    setSaving(true)

    try {

      let buildingId = item.building_id

      // ЕСЛИ ИЗМЕНИЛИ АДРЕС
      if (coordinates) {

        const {
          data: newBuilding,
        } = await supabase
          .from('buildings')
          .insert({
            address: selectedAddress,
            coords:
              `SRID=4326;POINT(${coordinates.lon} ${coordinates.lat})`,
          })
          .select()
          .single()

        if (newBuilding) {
          buildingId = newBuilding.id
        }
      }

      // UPLOAD НОВЫХ ФОТО
      const uploadedUrls: string[] = []

      for (const image of newImages) {

        const fileExt =
          image.name.split('.').pop()

        const fileName =
          `${Date.now()}-${Math.random()}.${fileExt}`

        const { error } =
          await supabase.storage
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

      // ВСЕ ФОТО
      const finalImages = [

        ...existingImages,

        ...uploadedUrls,

      ]

      // UPDATE
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

      alert('Сохранено ✅')

      navigate(-1)

    } catch (err) {

      console.log(err)

      alert('Ошибка сохранения')

    } finally {

      setSaving(false)
    }
  }

  if (loading) {

    return (
      <div style={{ padding: 20 }}>
        Загрузка...
      </div>
    )
  }

  return (

    <div style={styles.page}>

      <button
        onClick={() => navigate(-1)}
        style={styles.backBtn}
      >
        ← Назад
      </button>

      <h1 style={styles.title}>
        Редактировать объявление
      </h1>

      <form onSubmit={handleSave}>

        {/* TITLE */}
        <div style={styles.block}>

          <label style={styles.label}>
            Название
          </label>

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            style={styles.input}
          />

        </div>

        {/* PRICE */}
        <div style={styles.block}>

          <label style={styles.label}>
            Цена
          </label>

          <input
            type="number"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            style={styles.input}
          />

        </div>

        {/* DESCRIPTION */}
        <div style={styles.block}>

          <label style={styles.label}>
            Описание
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            style={styles.textarea}
          />

        </div>

        {/* DEAL TYPE */}
        <div style={styles.block}>

          <label style={styles.label}>
            Тип сделки
          </label>

          <select
            value={dealType}
            onChange={(e) =>
              setDealType(
                e.target.value as DealType
              )
            }
            style={styles.input}
          >

            <option value="sale">
              Продажа
            </option>

            <option value="rent">
              Аренда
            </option>

            <option value="gift">
              Даром
            </option>

          </select>

        </div>

        {/* ФОТО */}
        <div style={styles.block}>

          <div style={styles.label}>
            Добавить фото
          </div>

          <div style={styles.previewGrid}>

            {/* ADD PHOTO */}

            <label style={styles.uploadBox}>

              <div style={styles.plus}>
                +
              </div>

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

            {/* OLD IMAGES */}

            {existingImages.map((
              image,
              index
            ) => (

              <div
                key={index}
                style={styles.previewItem}
              >

                <img
                  src={image}
                  style={styles.previewImage}
                />

                <button
                  type="button"
                  style={styles.removeBtn}
                  onClick={() => {

                    setExistingImages(prev =>
                      prev.filter(
                        (_, i) =>
                          i !== index
                      )
                    )
                  }}
                >
                  ✕
                </button>

              </div>

            ))}

            {/* NEW IMAGES */}

            {newImages.map((
              image,
              index
            ) => (

              <div
                key={index}
                style={styles.previewItem}
              >

                <img
                  src={URL.createObjectURL(image)}
                  style={styles.previewImage}
                />

                <button
                  type="button"
                  style={styles.removeBtn}
                  onClick={() => {

                    setNewImages(prev =>
                      prev.filter(
                        (_, i) =>
                          i !== index
                      )
                    )
                  }}
                >
                  ✕
                </button>

              </div>

            ))}

          </div>

        </div>

        {/* MAP */}
        <div style={styles.block}>

          <label style={styles.label}>
            Местоположение
          </label>

          <YandexMap
            onLocationSelect={
              handleLocationSelect
            }
          />

        </div>

        {/* ADDRESS */}
        {selectedAddress && (

          <div style={styles.addressBox}>

            <strong>
              📍 Адрес:
            </strong>

            <div>
              {selectedAddress}
            </div>

          </div>

        )}

        {/* SAVE */}
        <button
          disabled={saving}
          style={styles.submitBtn}
        >

          {saving
            ? 'Сохранение...'
            : 'Сохранить'}

        </button>

      </form>

    </div>
  )
}

const styles: Record<
  string,
  React.CSSProperties
> = {

  page: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    paddingBottom: '100px',
  },

  title: {
    fontSize: '28px',
    marginBottom: '24px',
  },

  backBtn: {
    marginBottom: '14px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '15px',
  },

  block: {
    marginBottom: '22px',
  },

  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: 600,
    fontSize: '16px',
  },

  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    fontSize: '15px',
  },

  textarea: {
    width: '100%',
    minHeight: '120px',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    fontSize: '15px',
    resize: 'vertical',
  },

  previewGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
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
  },

  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  removeBtn: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },

  addressBox: {
    marginTop: '14px',
    padding: '14px',
    borderRadius: '10px',
    background: '#e8f5e9',
    border: '1px solid #4caf50',
  },

  submitBtn: {
    width: '100%',
    padding: '15px',
    borderRadius: '12px',
    border: 'none',
    background: '#5664c1',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '20px',
  },
}