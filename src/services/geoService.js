/**
 * Serviço de Geolocalização e Cálculo de Distâncias Reais para a Região Leste de Goiânia
 */

// Coordenadas centrais aproximadas dos bairros da Região Leste de Goiânia - GO
export const BAIRROS_COORDENADAS = {
  'Jardim Novo Mundo': { lat: -16.6852, lng: -49.2154 },
  'Vila Pedroso': { lat: -16.6698, lng: -49.1823 },
  'Aroeiras': { lat: -16.6781, lng: -49.1932 },
  'Riviera': { lat: -16.6991, lng: -49.2015 },
  'Alphaville Flamboyant': { lat: -16.7112, lng: -49.2189 },
  'Jardim Goiás': { lat: -16.7025, lng: -49.2341 },
  'Vila Bandeirante': { lat: -16.6740, lng: -49.2280 },
  'Água Branca': { lat: -16.6890, lng: -49.2080 }
};

/**
 * Fórmula de Haversine para calcular a distância em metros/km entre duas coordenadas geográficas
 */
export function calcularDistancia(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanciaKm = R * c;
  
  return distanciaKm;
}

/**
 * Formata distância de forma humanizada (ex: 350 m ou 1.8 km)
 */
export function formatarDistancia(distanciaKm) {
  if (distanciaKm === null || distanciaKm === undefined) return 'Próximo a você';
  if (distanciaKm < 1) {
    const metros = Math.round(distanciaKm * 1000);
    return `${metros} m`;
  }
  return `${distanciaKm.toFixed(1)} km`;
}

/**
 * Solicita a localização do usuário via GPS do navegador
 */
export function obterLocalizacaoUsuario() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada pelo seu navegador'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}
