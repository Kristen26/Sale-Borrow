// pages/NewItemPage.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthProvider';
import YandexMap from '../components/LeafletMap';
import type { Enums } from '../types/database.types';

type DealType = Enums<'deal_type'>;

export default function NewItemPage() {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [dealType, setDealType] = useState<DealType>('sale');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Обработчик выбора места на карте
  const handleLocationSelect = (address: string, lat: number, lon: number) => {
    setSelectedAddress(address);
    setCoordinates({ lat, lon });
    console.log('Выбран адрес:', address, 'Координаты:', lat, lon);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!session?.user) {
        throw new Error('Пользователь не авторизован');
      }
      
      if (!coordinates) {
        alert('Пожалуйста, выберите адрес на карте');
        setLoading(false);
        return;
      }

      // 1. Создаем здание
      const { data: newBuilding, error: buildingError } = await supabase
        .from('buildings')
        .insert({
          address: selectedAddress,
          coords: `SRID=4326;POINT(${coordinates.lon} ${coordinates.lat})`,
        })
        .select()
        .single();

      if (buildingError) {
        console.error('Ошибка создания здания:', buildingError);
        throw buildingError;
      }

      // 2. Создаем объявление
      const { error: itemError } = await supabase
        .from('items')
        .insert({
          title,
          price: Number(price),
          description,
          deal_type: dealType,
          owner_id: session.user.id,
          building_id: newBuilding.id,
          is_active: true,
          image_urls: [],
        });

      if (itemError) {
        console.error('Ошибка создания объявления:', itemError);
        throw itemError;
      }

      alert('Объявление успешно создано!');
      
      // Очистка формы
      setTitle('');
      setPrice('');
      setDescription('');
      setDealType('sale');
      setSelectedAddress('');
      setCoordinates(null);
      
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при создании объявления. Проверьте консоль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', fontSize: '28px' }}>Новое объявление</h1>
      
      <form onSubmit={handleSubmit}>
        {/* Название */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Название *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
          />
        </div>
        
        {/* Цена */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Цена *
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
          />
        </div>
        
        {/* Описание */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '16px',
              resize: 'vertical',
            }}
          />
        </div>
        
        {/* Тип сделки */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Тип сделки *
          </label>
          <select 
            value={dealType} 
            onChange={(e) => setDealType(e.target.value as DealType)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
          >
            <option value="sale">💰 Продажа</option>
            <option value="rent">📦 Аренда</option>
            <option value="gift">🎁 Бесплатно</option>
          </select>
        </div>
        
        {/* Карта */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Местоположение *
          </label>
          <YandexMap onLocationSelect={handleLocationSelect} />
        </div>
        
        {/* Отображение выбранного адреса */}
        {selectedAddress && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            border: '1px solid #4caf50'
          }}>
            <strong>✅ Выбранный адрес:</strong> {selectedAddress}
          </div>
        )}
        
        {/* Кнопка отправки */}
        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: loading ? '#ccc' : '#1a1a1a',
            background: '#5664c1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            marginTop: '20px',
          }}
        >
          {loading ? 'Создание...' : 'Создать объявление'}
        </button>
      </form>
    </div>
  );
}