// pages/NewItemPage.tsx

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import YandexMap from '../components/LeafletMap'
import type { Enums } from '../types/database.types'

type DealType = Enums<'deal_type'>

export default function NewItemPage() {

  const { session } = useAuth()

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')

  const [dealType, setDealType] =
    useState<DealType>('sale')

  const [selectedAddress, setSelectedAddress] =
    useState('')

  const [coordinates, setCoordinates] =
    useState<{ lat: number; lon: number } | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [images, setImages] =
    useState<File[]>([])

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

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

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

      // BUILDING
      const {
        data: newBuilding,
        error: buildingError,
      } = await supabase
        .from('buildings')
        .insert({
          address: selectedAddress,
          coords:
            `SRID=4326;POINT(${coordinates.lon} ${coordinates.lat})`,
        })
        .select()
        .single()

      if (buildingError) {
        throw buildingError
      }

      // UPLOAD IMAGES
      const uploadedUrls: string[] = []

      for (const image of images) {

        const fileExt =
          image.name.split('.').pop()

        const fileName =
          `${Date.now()}-${Math.random()}.${fileExt}`

        const { error: uploadError } =
          await supabase.storage
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

      // CREATE ITEM
      const { error: itemError } =
        await supabase
          .from('items')
          .insert({
            title,
            description,
            price: Number(price),
            deal_type: dealType,
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

    <div style={styles.page}>

      <h1 style={styles.title}>
        Новое объявление
      </h1>

      <form onSubmit={handleSubmit}>

        <div style={styles.block}>

          <label style={styles.label}>
            Название
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
            style={styles.input}
          />

        </div>

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
            required
            style={styles.input}
          />

        </div>

        <div style={styles.block}>

          <label style={styles.label}>
            Описание
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows={5}
            style={styles.textarea}
          />

        </div>

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
              💰 Продажа
            </option>

            <option value="rent">
              📦 Аренда
            </option>

            <option value="gift">
              🎁 Бесплатно
            </option>

          </select>

        </div>

        {/* PHOTO */}

        <div style={styles.block}>

          <div style={styles.label}>
            Добавить фото
          </div>

          <div style={styles.previewGrid}>

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
                  setImages(prev => [
                    ...prev,
                    ...Array.from(e.target.files || []),
                  ])
                }}
              />

            </label>

            {images.map((image, index) => (

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

                    setImages(prev =>
                      prev.filter(
                        (_, i) => i !== index
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

        {selectedAddress && (

          <div style={styles.addressBox}>

            <strong>
              ✅ Выбранный адрес:
            </strong>

            <div>
              {selectedAddress}
            </div>

          </div>

        )}

        <button
          type="submit"
          disabled={loading}
          style={styles.submitBtn}
        >

          {loading
            ? 'Создание...'
            : 'Создать объявление'}

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
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },

  title: {
    marginBottom: '24px',
    fontSize: '28px',
  },

  block: {
    marginBottom: '20px',
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
    marginBottom: '20px',
    padding: '14px',
    background: '#e8f5e9',
    border: '1px solid #4caf50',
    borderRadius: '10px',
  },

  submitBtn: {
    width: '100%',
    padding: '15px',
    border: 'none',
    borderRadius: '12px',
    background: '#5664c1',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '10px',
  },
}